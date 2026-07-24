"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getProviderForPersona } from "@/modules/artificial-intelligence/gateway";
import { stripWeekDayPrefix } from "@/modules/planning/format";
import {
  addFlashcardSchema,
  addQuestionSchema,
  saveLessonSchema,
  saveMilestoneSchema,
  updateWeekSchema,
  type AddFlashcardInput,
  type AddQuestionInput,
  type SaveLessonInput,
  type SaveMilestoneInput,
  type UpdateWeekInput,
} from "./schema";

async function assertAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return null;
  }
  return session.user;
}

function auditLog(adminId: string, action: string, details: Record<string, unknown>) {
  logger.info("admin_action", { adminId, action, ...details });
}

export async function updateWeekAction(input: UpdateWeekInput) {
  const admin = await assertAdmin();
  if (!admin) return { error: "Apenas administradores podem editar o currículo." };

  const parsed = updateWeekSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  await db.week.update({
    where: { id: parsed.data.weekId },
    data: {
      title: parsed.data.title,
      objective: parsed.data.objective,
      status: parsed.data.status,
      isManuallyEdited: true,
    },
  });

  auditLog(admin.id, "update_week", { weekId: parsed.data.weekId });
  revalidatePath("/admin/curriculum");
  revalidatePath("/roadmap");
  return { error: null };
}

export async function saveLessonAction(input: SaveLessonInput) {
  const admin = await assertAdmin();
  if (!admin) return { error: "Apenas administradores podem editar o currículo." };

  const parsed = saveLessonSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { lessonId, ...data } = parsed.data;

  if (lessonId) {
    await db.lesson.update({ where: { id: lessonId }, data: { ...data, isManuallyEdited: true } });
  } else {
    await db.lesson.create({ data });
  }

  auditLog(admin.id, lessonId ? "update_lesson" : "create_lesson", { weekId: data.weekId });
  revalidatePath(`/admin/curriculum/${data.weekId}`);
  revalidatePath("/learn");
  return { error: null };
}

export async function archiveLessonAction(lessonId: string) {
  const admin = await assertAdmin();
  if (!admin) return { error: "Apenas administradores podem editar o currículo." };

  const lesson = await db.lesson.update({
    where: { id: lessonId },
    data: { status: "ARCHIVED" },
  });

  auditLog(admin.id, "archive_lesson", { lessonId });
  revalidatePath(`/admin/curriculum/${lesson.weekId}`);
  revalidatePath("/learn");
  return { error: null };
}

export async function addFlashcardAction(input: AddFlashcardInput) {
  const admin = await assertAdmin();
  if (!admin) return { error: "Apenas administradores podem editar o currículo." };

  const parsed = addFlashcardSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };

  await db.flashcard.create({ data: parsed.data });

  const lesson = await db.lesson.findUnique({ where: { id: parsed.data.lessonId } });
  auditLog(admin.id, "add_flashcard", { lessonId: parsed.data.lessonId });
  revalidatePath(`/admin/curriculum/${lesson?.weekId}`);
  revalidatePath("/flashcards");
  return { error: null };
}

export async function deleteFlashcardAction(flashcardId: string, weekId: string) {
  const admin = await assertAdmin();
  if (!admin) return { error: "Apenas administradores podem editar o currículo." };

  await db.flashcard.delete({ where: { id: flashcardId } });

  auditLog(admin.id, "delete_flashcard", { flashcardId });
  revalidatePath(`/admin/curriculum/${weekId}`);
  revalidatePath("/flashcards");
  return { error: null };
}

export async function addQuestionAction(input: AddQuestionInput) {
  const admin = await assertAdmin();
  if (!admin) return { error: "Apenas administradores podem editar o currículo." };

  const parsed = addQuestionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  let assessment = await db.assessment.findFirst({
    where: { lessonId: parsed.data.lessonId },
  });
  if (!assessment) {
    const lesson = await db.lesson.findUnique({ where: { id: parsed.data.lessonId } });
    assessment = await db.assessment.create({
      data: {
        lessonId: parsed.data.lessonId,
        title: `Quiz: ${lesson?.title ?? "aula"}`,
        status: "AVAILABLE",
      },
    });
  }

  const questionCount = await db.question.count({ where: { assessmentId: assessment.id } });

  await db.question.create({
    data: {
      assessmentId: assessment.id,
      order: questionCount,
      prompt: parsed.data.prompt,
      type: "MULTIPLE_CHOICE",
      explanation: parsed.data.explanation,
      options: {
        create: parsed.data.options.map((opt, index) => ({
          order: index,
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
      },
    },
  });

  const lesson = await db.lesson.findUnique({ where: { id: parsed.data.lessonId } });
  auditLog(admin.id, "add_question", { lessonId: parsed.data.lessonId });
  revalidatePath(`/admin/curriculum/${lesson?.weekId}`);
  revalidatePath("/assessments");
  return { error: null };
}

export async function deleteQuestionAction(questionId: string, weekId: string) {
  const admin = await assertAdmin();
  if (!admin) return { error: "Apenas administradores podem editar o currículo." };

  await db.question.delete({ where: { id: questionId } });

  auditLog(admin.id, "delete_question", { questionId });
  revalidatePath(`/admin/curriculum/${weekId}`);
  revalidatePath("/assessments");
  return { error: null };
}

function buildLessonGenerationMessage(lesson: { title: string; objective: string | null }) {
  const theme = stripWeekDayPrefix(lesson.title);
  return [
    `Gere o conteúdo completo desta aula em Markdown, para o tema: "${theme}"`,
    `Não inclua "Semana" ou "Dia" no título/heading da aula — comece direto pelo tema.`,
    `(objetivo: ${lesson.objective ?? "não informado"}).`,
    "Use o conteúdo de referência (tópicos e checklist já definidos para esta semana) apenas para",
    "saber QUAIS tópicos cobrir e qual é o projeto do módulo — não copie o texto dele, ele é só um",
    "esqueleto raso. Você deve ENSINAR CADA TÓPICO de verdade, como um professor especialista",
    "faria em uma aula real. Não invente tecnologias que não estejam no conteúdo de referência.",
    "PROIBIDO: respostas que só instruem o estudante a \"pesquisar a documentação oficial\",",
    "\"testar por conta própria\" ou equivalentes, sem antes ensinar o conteúdo você mesmo — isso",
    "é uma falha grave, não uma aula.",
    "A aula final deve ter, nesta ordem, em seções Markdown separadas: (1) objetivo da aula; (2)",
    "explicação completa e tecnicamente precisa de cada conceito/tópico, escrita por você, não",
    "delegada a uma fonte externa; (3) pelo menos uma analogia concreta do dia a dia por conceito",
    "difícil; (4) uma seção aplicando o princípio 80/20, destacando explicitamente os 20% do",
    "conteúdo que trazem 80% do entendimento prático; (5) exemplos reais e concretos — trechos de",
    "código, comandos de terminal, configurações, conforme o tema, nunca substituídos por",
    "instruções genéricas; (6) só então um checklist de laboratório guiado; (7) exercícios.",
  ].join(" ");
}

/**
 * Gera conteúdo completo de aula via IA (persona Professor) e salva com `status = DRAFT` — nunca
 * publicado automaticamente (ver Etapa 3 / docs/DECISIONS.md). Se a aula já foi editada
 * manualmente (`isManuallyEdited`), exige `confirmOverwrite: true` explícito para prosseguir.
 * Se nenhum provider real (OpenAI/Claude) estiver configurado, recusa em vez de substituir o
 * conteúdo estruturado existente por um resumo genérico do Mock.
 */
export async function generateLessonContentAction(lessonId: string, confirmOverwrite = false) {
  const admin = await assertAdmin();
  if (!admin) return { error: "Apenas administradores podem editar o currículo." };

  const lesson = await db.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) return { error: "Aula não encontrada." };

  if (lesson.isManuallyEdited && !confirmOverwrite) {
    return {
      error:
        "Esta aula foi editada manualmente. Confirme explicitamente para gerar e substituir o conteúdo mesmo assim.",
      needsConfirmation: true,
    };
  }

  const provider = getProviderForPersona("PROFESSOR");
  if (provider.name === "mock") {
    return {
      error:
        "Nenhum provider de IA real configurado (AI_OPENAI_API_KEY ou AI_CLAUDE_API_KEY). O conteúdo estruturado atual não será substituído por um resumo genérico do provider mock.",
    };
  }

  try {
    const content = await provider.converse({
      persona: "PROFESSOR",
      message: buildLessonGenerationMessage(lesson),
      context: {
        currentLessonTitle: stripWeekDayPrefix(lesson.title),
        currentLessonContent: lesson.contentMarkdown ?? undefined,
        completedLessonTitles: [],
        openGoalTitles: [],
        recentQuizScores: [],
      },
    });

    await db.lesson.update({
      where: { id: lessonId },
      data: { contentMarkdown: content, status: "DRAFT", aiGeneratedAt: new Date() },
    });

    auditLog(admin.id, "generate_lesson_content", { lessonId, provider: provider.name });
    revalidatePath(`/admin/curriculum/${lesson.weekId}`);
    revalidatePath(`/learn/${lessonId}`);
    return { error: null };
  } catch (error) {
    logger.error("generate_lesson_content failed", { lessonId, error: String(error) });
    return { error: "Não foi possível gerar o conteúdo agora. Tente novamente em instantes." };
  }
}

/** Aprova conteúdo gerado por IA: DRAFT -> AVAILABLE. Nunca pula essa revisão humana. */
export async function approveLessonContentAction(lessonId: string) {
  const admin = await assertAdmin();
  if (!admin) return { error: "Apenas administradores podem editar o currículo." };

  const lesson = await db.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) return { error: "Aula não encontrada." };
  if (lesson.status !== "DRAFT") return { error: "Esta aula não está aguardando aprovação." };

  await db.lesson.update({ where: { id: lessonId }, data: { status: "AVAILABLE" } });

  auditLog(admin.id, "approve_lesson_content", { lessonId });
  revalidatePath(`/admin/curriculum/${lesson.weekId}`);
  revalidatePath("/learn");
  revalidatePath(`/learn/${lessonId}`);
  return { error: null };
}

/**
 * Cria ou atualiza o marco (Trilha Produto ou Trilha Profissional) vinculado a uma semana
 * (Etapa 4 + expansão de Trilhas). Reaproveita `ArchitectureMilestone` — nunca mistura com a
 * linha do tempo da AI Labs (track = AI_LABS). `order` usa o próprio número da semana. Uma
 * semana só pode ter UM marco no total (`weekId` único na tabela), então trocar o `track` aqui
 * substitui um eventual marco do outro track que já existisse nesta semana.
 */
export async function saveMilestoneAction(input: SaveMilestoneInput) {
  const admin = await assertAdmin();
  if (!admin) return { error: "Apenas administradores podem editar o currículo." };

  const parsed = saveMilestoneSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const week = await db.week.findUnique({ where: { id: parsed.data.weekId } });
  if (!week) return { error: "Semana não encontrada." };

  await db.architectureMilestone.upsert({
    where: { weekId: parsed.data.weekId },
    update: {
      track: parsed.data.track,
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
    },
    create: {
      track: parsed.data.track,
      weekId: parsed.data.weekId,
      order: week.number,
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
    },
  });

  auditLog(admin.id, "save_milestone", { weekId: parsed.data.weekId, track: parsed.data.track });
  revalidatePath(`/admin/curriculum/${parsed.data.weekId}`);
  revalidatePath("/roadmap");
  revalidatePath(`/roadmap/${parsed.data.weekId}`);
  return { error: null };
}
