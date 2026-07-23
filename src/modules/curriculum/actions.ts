"use server";

import { revalidatePath } from "next/cache";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { importCurriculum } from "@/modules/curriculum-import/service";
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

  revalidatePath("/learn");
  revalidatePath(`/learn/${parsed.data.lessonId}`);
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
