"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getProviderForPersona } from "@/modules/artificial-intelligence/gateway";
import { awardXp, checkAndAwardBadges } from "@/modules/gamification/service";
import {
  completeLaboratorySchema,
  saveLaboratorySchema,
  type CompleteLaboratoryInput,
  type SaveLaboratoryInput,
} from "./schema";

export async function completeLaboratoryAction(input: CompleteLaboratoryInput) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const parsed = completeLaboratorySchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };

  const laboratory = await db.laboratory.findUnique({ where: { id: parsed.data.laboratoryId } });
  if (!laboratory) return { error: "Laboratório não encontrado." };

  const existing = await db.laboratoryCompletion.findUnique({
    where: {
      userId_laboratoryId: { userId: session.user.id, laboratoryId: parsed.data.laboratoryId },
    },
  });

  await db.laboratoryCompletion.upsert({
    where: {
      userId_laboratoryId: { userId: session.user.id, laboratoryId: parsed.data.laboratoryId },
    },
    update: { evidenceUrl: parsed.data.evidenceUrl || null, notes: parsed.data.notes },
    create: {
      userId: session.user.id,
      laboratoryId: parsed.data.laboratoryId,
      evidenceUrl: parsed.data.evidenceUrl || null,
      notes: parsed.data.notes,
    },
  });

  if (!existing) {
    await awardXp(session.user.id, "laboratory_completed", 15, {
      type: "Laboratory",
      id: parsed.data.laboratoryId,
    });
  }
  await checkAndAwardBadges(session.user.id);

  revalidatePath("/labs");
  revalidatePath(`/labs/${parsed.data.laboratoryId}`);
  return { error: null };
}

export async function saveLaboratoryAction(input: SaveLaboratoryInput) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "Apenas administradores podem gerenciar laboratórios." };
  }

  const parsed = saveLaboratorySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { laboratoryId, ...data } = parsed.data;

  if (laboratoryId) {
    await db.laboratory.update({ where: { id: laboratoryId }, data: { ...data, isManuallyEdited: true } });
  } else {
    await db.laboratory.create({ data: { ...data, isManuallyEdited: true } });
  }

  logger.info("admin_action", {
    adminId: session.user.id,
    action: laboratoryId ? "update_laboratory" : "create_laboratory",
  });
  revalidatePath("/admin/labs");
  revalidatePath("/labs");
  return { error: null };
}

export async function archiveLaboratoryAction(laboratoryId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "Apenas administradores podem gerenciar laboratórios." };
  }

  await db.laboratory.update({ where: { id: laboratoryId }, data: { status: "ARCHIVED" } });

  logger.info("admin_action", { adminId: session.user.id, action: "archive_laboratory", laboratoryId });
  revalidatePath("/admin/labs");
  revalidatePath("/labs");
  return { error: null };
}

function buildLabGenerationMessage(lesson: { title: string; objective: string | null }) {
  return [
    `Crie um laboratório guiado, passo a passo, 100% prático, para a aula "${lesson.title}"`,
    `(objetivo da aula: ${lesson.objective ?? "não informado"}).`,
    "Use o conteúdo da aula fornecido como contexto para saber quais tópicos/tecnologias o",
    "laboratório deve exercitar — mas não repita a teoria da aula aqui, o laboratório é só a",
    "prática: comandos reais, passos numerados, resultado esperado de cada passo.",
    "Estruture a resposta em Markdown com estas seções, nesta ordem: ## Objetivo (1-2 frases,",
    "o que o aluno vai construir/praticar), ## Ambiente (o que precisa estar instalado/",
    "configurado antes de começar), ## Passos (numerados, cada um com o comando ou ação real e",
    "o resultado esperado daquele passo específico — use blocos de código para comandos),",
    "## Resultado esperado (o estado final, o que o aluno deve conseguir mostrar/entregar),",
    "## Validação (como o aluno confirma que fez certo), ## Troubleshooting (2-3 problemas",
    "comuns e como resolver).",
  ].join(" ");
}

/**
 * Gera um laboratório guiado passo a passo (persona Professor) vinculado a uma aula específica
 * — o laboratório sempre mostra a qual aula/semana ele se refere (`Laboratory.lessonId`).
 * Mesmo padrão de aprovação da Etapa 3: salva com `status = DRAFT` até um admin aprovar; recusa
 * se nenhum provider real estiver configurado (evita substituir por resumo genérico do Mock);
 * exige confirmação explícita para sobrescrever um laboratório editado manualmente.
 */
export async function generateLabContentAction(lessonId: string, confirmOverwrite = false) {
  const admin = await assertLabAdmin();
  if (!admin) return { error: "Apenas administradores podem gerenciar laboratórios." };

  const lesson = await db.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) return { error: "Aula não encontrada." };

  const existing = await db.laboratory.findFirst({ where: { lessonId } });
  if (existing?.isManuallyEdited && !confirmOverwrite) {
    return {
      error:
        "Este laboratório foi editado manualmente. Confirme explicitamente para gerar e substituir mesmo assim.",
      needsConfirmation: true,
    };
  }

  const provider = getProviderForPersona("PROFESSOR");
  if (provider.name === "mock") {
    return {
      error:
        "Nenhum provider de IA real configurado (AI_OPENAI_API_KEY ou AI_CLAUDE_API_KEY). Nenhum laboratório genérico foi gerado.",
    };
  }

  try {
    const instructions = await provider.converse({
      persona: "PROFESSOR",
      message: buildLabGenerationMessage(lesson),
      context: {
        currentLessonTitle: lesson.title,
        currentLessonContent: lesson.contentMarkdown ?? undefined,
        completedLessonTitles: [],
        openGoalTitles: [],
        recentQuizScores: [],
      },
    });

    const data = {
      lessonId,
      title: `Laboratório — ${lesson.title}`,
      objective: lesson.objective,
      instructions,
      isDemo: false,
      aiGeneratedAt: new Date(),
      status: "DRAFT" as const,
    };

    const lab = existing
      ? await db.laboratory.update({ where: { id: existing.id }, data })
      : await db.laboratory.create({ data });

    logger.info("admin_action", { adminId: admin.id, action: "generate_lab_content", lessonId, laboratoryId: lab.id });
    revalidatePath(`/admin/curriculum/${lesson.weekId}`);
    revalidatePath("/admin/labs");
    revalidatePath("/labs");
    revalidatePath(`/labs/${lab.id}`);
    return { error: null };
  } catch (error) {
    logger.error("generate_lab_content failed", { lessonId, error: String(error) });
    return { error: "Não foi possível gerar o laboratório agora. Tente novamente em instantes." };
  }
}

/** Aprova laboratório gerado por IA: DRAFT -> AVAILABLE. */
export async function approveLabContentAction(laboratoryId: string) {
  const admin = await assertLabAdmin();
  if (!admin) return { error: "Apenas administradores podem gerenciar laboratórios." };

  const lab = await db.laboratory.findUnique({ where: { id: laboratoryId } });
  if (!lab) return { error: "Laboratório não encontrado." };
  if (lab.status !== "DRAFT") return { error: "Este laboratório não está aguardando aprovação." };

  await db.laboratory.update({ where: { id: laboratoryId }, data: { status: "AVAILABLE" } });

  logger.info("admin_action", { adminId: admin.id, action: "approve_lab_content", laboratoryId });
  revalidatePath("/admin/labs");
  revalidatePath("/labs");
  if (lab.lessonId) {
    const lesson = await db.lesson.findUnique({ where: { id: lab.lessonId } });
    if (lesson) revalidatePath(`/admin/curriculum/${lesson.weekId}`);
  }
  return { error: null };
}

async function assertLabAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return null;
  return session.user;
}
