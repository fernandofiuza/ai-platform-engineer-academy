"use server";

import { revalidatePath } from "next/cache";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { importCurriculum } from "@/modules/curriculum-import/service";
import { awardXp, checkAndAwardBadges } from "@/modules/gamification/service";
import { recomputeSkillsForLesson } from "@/modules/skills/service";
import {
  checklistItemUpdateSchema,
  completeLessonSchema,
  type ChecklistItemUpdateInput,
  type CompleteLessonInput,
} from "./schema";

export async function updateChecklistItemAction(input: ChecklistItemUpdateInput) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const parsed = checklistItemUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos." };
  }

  const { checklistItemId, done, note, evidenceUrl, installedVersion, reviewNeeded } = parsed.data;

  const checklistItem = await db.checklistItem.findUnique({ where: { id: checklistItemId } });
  if (!checklistItem) {
    return { error: "Item não encontrado." };
  }

  await db.checklistItemProgress.upsert({
    where: { userId_checklistItemId: { userId: session.user.id, checklistItemId } },
    update: {
      done,
      note,
      evidenceUrl: evidenceUrl || null,
      installedVersion,
      reviewNeeded,
      completedAt: done ? new Date() : null,
    },
    create: {
      userId: session.user.id,
      checklistItemId,
      done,
      note,
      evidenceUrl: evidenceUrl || null,
      installedVersion,
      reviewNeeded: reviewNeeded ?? false,
      completedAt: done ? new Date() : null,
    },
  });

  await checkAndAwardBadges(session.user.id);

  revalidatePath("/roadmap");
  return { error: null };
}

export async function completeLessonAction(input: CompleteLessonInput) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const parsed = completeLessonSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const lesson = await db.lesson.findUnique({ where: { id: parsed.data.lessonId } });
  if (!lesson) {
    return { error: "Aula não encontrada." };
  }

  const existing = await db.lessonCompletion.findUnique({
    where: { userId_lessonId: { userId: session.user.id, lessonId: parsed.data.lessonId } },
  });

  await db.lessonCompletion.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId: parsed.data.lessonId } },
    update: {
      confidence: parsed.data.confidence,
      whatLearned: parsed.data.whatLearned,
      whatUnclear: parsed.data.whatUnclear,
      completedAt: new Date(),
    },
    create: {
      userId: session.user.id,
      lessonId: parsed.data.lessonId,
      confidence: parsed.data.confidence,
      whatLearned: parsed.data.whatLearned,
      whatUnclear: parsed.data.whatUnclear,
    },
  });

  if (!existing) {
    await awardXp(session.user.id, "lesson_completed", 10, { type: "Lesson", id: parsed.data.lessonId });
  }
  await recomputeSkillsForLesson(session.user.id, parsed.data.lessonId);
  await checkAndAwardBadges(session.user.id);

  revalidatePath("/learn");
  revalidatePath(`/learn/${parsed.data.lessonId}`);
  revalidatePath("/skills");
  return { error: null };
}

/**
 * Desfaz a conclusão de uma aula: remove o registro de `LessonCompletion` (e a reflexão
 * associada), reverte o XP concedido na conclusão original (evento com `refType: "Lesson"`,
 * `refId: lessonId`) e recalcula a evidência de competências ligadas a essa aula. Badges já
 * concedidos NÃO são revogados (consistente com o padrão usual de conquistas em gamificação —
 * uma vez ganho, não se perde por desfazer uma ação posterior).
 */
export async function uncompleteLessonAction(lessonId: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const existing = await db.lessonCompletion.findUnique({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
  });
  if (!existing) {
    return { error: "Esta aula ainda não foi concluída." };
  }

  await db.lessonCompletion.delete({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
  });
  await db.experienceEvent.deleteMany({
    where: { userId: session.user.id, kind: "lesson_completed", refType: "Lesson", refId: lessonId },
  });
  await recomputeSkillsForLesson(session.user.id, lessonId);

  revalidatePath("/learn");
  revalidatePath(`/learn/${lessonId}`);
  revalidatePath("/skills");
  return { error: null };
}

export async function runCurriculumImportAction() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "Apenas administradores podem executar a importação." };
  }

  try {
    const sourceFile = "Curso.md";
    const filePath = path.resolve(process.cwd(), sourceFile);
    const rawContent = await readFile(filePath, "utf-8");
    const result = await importCurriculum({ sourceFile, rawContent, force: true });
    revalidatePath("/admin/imports");
    revalidatePath("/roadmap");
    return { error: null, result };
  } catch (error) {
    logger.error("manual curriculum import failed", { error: String(error) });
    return { error: "Falha ao executar a importação. Ver logs do servidor.", result: null };
  }
}
