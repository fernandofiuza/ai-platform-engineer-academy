"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getGeminiProvider } from "@/modules/artificial-intelligence/gateway";
import { awardXp, checkAndAwardBadges } from "@/modules/gamification/service";
import { stripWeekDayPrefix } from "@/modules/planning/format";
import { buildLabGenerationMessage } from "./lab-generation";
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

  const { laboratoryId, lessonIds, ...data } = parsed.data;

  if (laboratoryId) {
    await db.laboratory.update({ where: { id: laboratoryId }, data: { ...data, isManuallyEdited: true } });
  } else {
    await db.laboratory.create({
      data: {
        ...data,
        isManuallyEdited: true,
        lessons: { create: lessonIds.map((lessonId) => ({ lessonId })) },
      },
    });
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

/**
 * Gera um laboratório guiado passo a passo (persona Professor) vinculado a um conjunto de aulas
 * — um mesmo laboratório pode abranger várias aulas (`LaboratoryLesson`), e uma aula pode ter
 * vários laboratórios. Mesmo padrão de aprovação das demais gerações por IA: salva com
 * `status = DRAFT` até um admin aprovar; recusa se nenhum provider real estiver configurado
 * (evita substituir por resumo genérico do Mock); exige confirmação explícita para sobrescrever
 * um laboratório editado manualmente.
 */
export async function generateLabContentAction(input: {
  laboratoryId?: string;
  lessonIds?: string[];
  weekNumbers?: number[];
  title?: string;
  scenario?: string;
  confirmOverwrite?: boolean;
}) {
  const admin = await assertLabAdmin();
  if (!admin) return { error: "Apenas administradores podem gerenciar laboratórios." };

  let lessonIds = input.lessonIds ?? [];
  if (input.weekNumbers?.length) {
    const weekLessons = await db.lesson.findMany({
      where: { week: { number: { in: input.weekNumbers } } },
      select: { id: true },
    });
    lessonIds = [...new Set([...lessonIds, ...weekLessons.map((l) => l.id)])];
  }
  if (lessonIds.length === 0) {
    return { error: "Selecione ao menos uma aula ou semana para vincular ao laboratório." };
  }

  const lessons = await db.lesson.findMany({
    where: { id: { in: lessonIds } },
    orderBy: [{ week: { number: "asc" } }, { order: "asc" }],
    include: { week: true },
  });
  if (lessons.length === 0) return { error: "Nenhuma aula encontrada para os IDs/semanas informados." };

  let existing = null;
  if (input.laboratoryId) {
    existing = await db.laboratory.findUnique({ where: { id: input.laboratoryId } });
    if (!existing) return { error: "Laboratório não encontrado." };
    if (existing.isManuallyEdited && !input.confirmOverwrite) {
      return {
        error:
          "Este laboratório foi editado manualmente. Confirme explicitamente para gerar e substituir mesmo assim.",
        needsConfirmation: true,
      };
    }
  }

  const provider = getGeminiProvider();
  if (provider.name === "mock") {
    return {
      error: "Nenhum provider de IA real configurado (AI_GEMINI_API_KEY). Nenhum laboratório genérico foi gerado.",
    };
  }

  const scenario = input.scenario?.trim() || input.title?.trim() || stripWeekDayPrefix(lessons[0].title);
  const title = input.title?.trim() || `Laboratório — ${stripWeekDayPrefix(lessons[0].title)}`;

  try {
    const instructions = await provider.converse({
      persona: "PROFESSOR",
      message: buildLabGenerationMessage({
        scenario,
        lessons: lessons.map((l) => ({ title: stripWeekDayPrefix(l.title), objective: l.objective })),
      }),
      context: {
        currentLessonTitle: stripWeekDayPrefix(lessons[0].title),
        // Só um resumo curto de cada aula, não o conteúdo inteiro: os títulos/objetivos já vão
        // no prompt (buildLabGenerationMessage), e o laboratório é só prática — não precisa da
        // teoria completa das aulas como contexto. Manter isso pequeno evita prompts de 100k+
        // caracteres quando um laboratório cobre muitas aulas de várias semanas.
        currentLessonContent: lessons
          .map((l) =>
            l.contentMarkdown
              ? `${stripWeekDayPrefix(l.title)}: ${l.contentMarkdown.slice(0, 400)}...`
              : null
          )
          .filter(Boolean)
          .join("\n\n"),
        completedLessonTitles: [],
        openGoalTitles: [],
        recentQuizScores: [],
      },
    });

    const data = {
      title,
      scenario,
      instructions,
      isDemo: false,
      aiGeneratedAt: new Date(),
      status: "DRAFT" as const,
    };

    const lab = existing
      ? await db.laboratory.update({
          where: { id: existing.id },
          data: {
            ...data,
            lessons: {
              deleteMany: {},
              create: lessonIds.map((lessonId) => ({ lessonId })),
            },
          },
        })
      : await db.laboratory.create({
          data: { ...data, lessons: { create: lessonIds.map((lessonId) => ({ lessonId })) } },
        });

    logger.info("admin_action", {
      adminId: admin.id,
      action: "generate_lab_content",
      lessonIds,
      laboratoryId: lab.id,
    });
    for (const week of new Set(lessons.map((l) => l.weekId))) {
      revalidatePath(`/admin/curriculum/${week}`);
    }
    revalidatePath("/admin/labs");
    revalidatePath("/labs");
    revalidatePath(`/labs/${lab.id}`);
    return { error: null, laboratoryId: lab.id };
  } catch (error) {
    logger.error("generate_lab_content failed", { lessonIds, error: String(error) });
    return { error: "Não foi possível gerar o laboratório agora. Tente novamente em instantes." };
  }
}

/** Aprova laboratório gerado por IA: DRAFT -> AVAILABLE. */
export async function approveLabContentAction(laboratoryId: string) {
  const admin = await assertLabAdmin();
  if (!admin) return { error: "Apenas administradores podem gerenciar laboratórios." };

  const lab = await db.laboratory.findUnique({
    where: { id: laboratoryId },
    include: { lessons: { include: { lesson: true } } },
  });
  if (!lab) return { error: "Laboratório não encontrado." };
  if (lab.status !== "DRAFT") return { error: "Este laboratório não está aguardando aprovação." };

  await db.laboratory.update({ where: { id: laboratoryId }, data: { status: "AVAILABLE" } });

  logger.info("admin_action", { adminId: admin.id, action: "approve_lab_content", laboratoryId });
  revalidatePath("/admin/labs");
  revalidatePath("/labs");
  for (const weekId of new Set(lab.lessons.map((ll) => ll.lesson.weekId))) {
    revalidatePath(`/admin/curriculum/${weekId}`);
  }
  return { error: null };
}

async function assertLabAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return null;
  return session.user;
}
