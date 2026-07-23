"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getProviderForPersona } from "@/modules/artificial-intelligence/gateway";
import {
  addFlashcardSchema,
  addQuestionSchema,
  saveLessonSchema,
  updateWeekSchema,
  type AddFlashcardInput,
  type AddQuestionInput,
  type SaveLessonInput,
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
  return [
    `Gere o conteúdo completo desta aula em Markdown, para o tema: "${lesson.title}"`,
    `(objetivo: ${lesson.objective ?? "não informado"}).`,
    "Use o conteúdo de referência (tópicos e checklist já definidos para esta semana) como base",
    "e reescreva como uma aula completa e aprofundada, mantendo os mesmos tópicos reais — não",
    "invente tecnologias que não estejam no conteúdo de referência.",
    "A aula final deve ter, em seções Markdown separadas: objetivo da aula, explicação completa",
    "de cada conceito, analogias que facilitem o entendimento, uma seção aplicando o princípio",
    "80/20 (destacando os 20% do conteúdo que trazem 80% do entendimento prático), exemplos",
    "práticos, um checklist de laboratório guiado, e exercícios.",
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
        currentLessonTitle: lesson.title,
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
