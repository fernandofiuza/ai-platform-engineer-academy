"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
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
    await db.lesson.update({ where: { id: lessonId }, data });
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
