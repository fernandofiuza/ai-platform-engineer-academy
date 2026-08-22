"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getGeminiProvider } from "@/modules/artificial-intelligence/gateway";
import { logActivity } from "./activity";
import { parseCourseText } from "./import-parser";
import { searchStudyHub } from "./queries";
import {
  commitImportSchema,
  createExternalCourseSchema,
  createExternalLessonSchema,
  createExternalModuleSchema,
  generateWithAiSchema,
  importJsonPayloadSchema,
  importJsonSchema,
  importTextSchema,
  updateExternalCourseSchema,
  updateExternalLessonSchema,
  updateExternalModuleSchema,
  type CommitImportInput,
  type CreateExternalCourseInput,
  type CreateExternalLessonInput,
  type CreateExternalModuleInput,
  type GenerateWithAiInput,
  type ImportJsonInput,
  type ImportTextInput,
  type UpdateExternalCourseInput,
  type UpdateExternalLessonInput,
  type UpdateExternalModuleInput,
} from "./schema";

/** Reaproveitado por `previewImportFromJsonAction` (JSON colado à mão) e
 * `previewImportFromAiAction` (JSON gerado pela IA) — mesma validação, mesmo mapeamento
 * pro formato de prévia usado pela tela de importação. */
function buildPreviewFromJsonPayload(raw: unknown) {
  const validated = importJsonPayloadSchema.safeParse(raw);
  if (!validated.success) {
    return {
      error: `JSON no formato errado: ${validated.error.issues[0]?.message ?? "estrutura inválida"}.`,
      preview: null,
    };
  }

  return {
    error: null,
    preview: {
      title: validated.data.course,
      modules: validated.data.modules.map((m) => ({
        title: m.name,
        lessons: m.lessons.map((title) => ({ title })),
      })),
    },
  };
}

async function assertOwnedCourse(userId: string, courseId: string) {
  const course = await db.externalCourse.findUnique({ where: { id: courseId } });
  if (!course || course.userId !== userId) return null;
  return course;
}

async function assertOwnedModule(userId: string, moduleId: string) {
  const courseModule = await db.externalModule.findUnique({
    where: { id: moduleId },
    include: { course: true },
  });
  if (!courseModule || courseModule.course.userId !== userId) return null;
  return courseModule;
}

async function assertOwnedLesson(userId: string, lessonId: string) {
  const lesson = await db.externalLesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: true } } },
  });
  if (!lesson || lesson.module.course.userId !== userId) return null;
  return lesson;
}

export async function createExternalCourseAction(input: CreateExternalCourseInput) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada.", courseId: null };

  const parsed = createExternalCourseSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", courseId: null };
  }

  const course = await db.externalCourse.create({
    data: { userId: session.user.id, ...parsed.data },
  });
  await logActivity(session.user.id, "COURSE_STARTED", course.title, `/study-hub/courses/${course.id}`);

  revalidatePath("/study-hub");
  revalidatePath("/study-hub/courses");
  return { error: null, courseId: course.id };
}

export async function updateExternalCourseAction(input: UpdateExternalCourseInput) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const parsed = updateExternalCourseSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const course = await assertOwnedCourse(session.user.id, parsed.data.courseId);
  if (!course) return { error: "Curso não encontrado." };

  const { courseId, ...data } = parsed.data;
  await db.externalCourse.update({ where: { id: courseId }, data });
  if (data.status === "COMPLETED" && course.status !== "COMPLETED") {
    await logActivity(session.user.id, "COURSE_COMPLETED", data.title, `/study-hub/courses/${courseId}`);
  }

  revalidatePath("/study-hub");
  revalidatePath("/study-hub/courses");
  revalidatePath(`/study-hub/courses/${courseId}`);
  return { error: null };
}

export async function deleteExternalCourseAction(courseId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const course = await assertOwnedCourse(session.user.id, courseId);
  if (!course) return { error: "Curso não encontrado." };

  await db.externalCourse.delete({ where: { id: courseId } });

  revalidatePath("/study-hub");
  revalidatePath("/study-hub/courses");
  return { error: null };
}

export async function createExternalModuleAction(input: CreateExternalModuleInput) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const parsed = createExternalModuleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const course = await assertOwnedCourse(session.user.id, parsed.data.courseId);
  if (!course) return { error: "Curso não encontrado." };

  const count = await db.externalModule.count({ where: { courseId: parsed.data.courseId } });
  await db.externalModule.create({
    data: { courseId: parsed.data.courseId, title: parsed.data.title, order: count + 1 },
  });

  revalidatePath(`/study-hub/courses/${parsed.data.courseId}`);
  return { error: null };
}

export async function updateExternalModuleAction(input: UpdateExternalModuleInput) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const parsed = updateExternalModuleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const courseModule = await assertOwnedModule(session.user.id, parsed.data.moduleId);
  if (!courseModule) return { error: "Módulo não encontrado." };

  await db.externalModule.update({
    where: { id: parsed.data.moduleId },
    data: { title: parsed.data.title },
  });

  revalidatePath(`/study-hub/courses/${courseModule.courseId}`);
  return { error: null };
}

export async function deleteExternalModuleAction(moduleId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const courseModule = await assertOwnedModule(session.user.id, moduleId);
  if (!courseModule) return { error: "Módulo não encontrado." };

  await db.externalModule.delete({ where: { id: moduleId } });

  revalidatePath(`/study-hub/courses/${courseModule.courseId}`);
  return { error: null };
}

export async function createExternalLessonAction(input: CreateExternalLessonInput) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const parsed = createExternalLessonSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const courseModule = await assertOwnedModule(session.user.id, parsed.data.moduleId);
  if (!courseModule) return { error: "Módulo não encontrado." };

  const count = await db.externalLesson.count({ where: { moduleId: parsed.data.moduleId } });
  await db.externalLesson.create({
    data: { moduleId: parsed.data.moduleId, title: parsed.data.title, order: count + 1 },
  });

  revalidatePath(`/study-hub/courses/${courseModule.courseId}`);
  return { error: null };
}

export async function updateExternalLessonAction(input: UpdateExternalLessonInput) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const parsed = updateExternalLessonSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const lesson = await assertOwnedLesson(session.user.id, parsed.data.lessonId);
  if (!lesson) return { error: "Aula não encontrada." };

  await db.externalLesson.update({
    where: { id: parsed.data.lessonId },
    data: { title: parsed.data.title },
  });

  revalidatePath(`/study-hub/courses/${lesson.module.courseId}`);
  revalidatePath(`/study-hub/courses/${lesson.module.courseId}/lessons/${parsed.data.lessonId}`);
  return { error: null };
}

export async function deleteExternalLessonAction(lessonId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const lesson = await assertOwnedLesson(session.user.id, lessonId);
  if (!lesson) return { error: "Aula não encontrada." };

  await db.externalLesson.delete({ where: { id: lessonId } });

  revalidatePath(`/study-hub/courses/${lesson.module.courseId}`);
  return { error: null };
}

export async function toggleExternalLessonCompletionAction(lessonId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const lesson = await assertOwnedLesson(session.user.id, lessonId);
  if (!lesson) return { error: "Aula não encontrada." };

  const completed = !lesson.completed;
  await db.externalLesson.update({
    where: { id: lessonId },
    data: {
      completed,
      completedAt: completed ? new Date() : null,
      lastAccessedAt: new Date(),
    },
  });
  const lessonHref = `/study-hub/courses/${lesson.module.courseId}/lessons/${lessonId}`;
  await logActivity(
    session.user.id,
    completed ? "LESSON_COMPLETED" : "LESSON_REOPENED",
    lesson.title,
    lessonHref
  );

  revalidatePath(`/study-hub/courses/${lesson.module.courseId}`);
  revalidatePath(`/study-hub/courses/${lesson.module.courseId}/lessons/${lessonId}`);
  revalidatePath("/study-hub");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function toggleLessonReviewMarkAction(lessonId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada.", marked: false };

  const [existing, lesson] = await Promise.all([
    db.lessonReviewMark.findUnique({
      where: { userId_lessonId: { userId: session.user.id, lessonId } },
    }),
    db.lesson.findUnique({ where: { id: lessonId }, select: { title: true } }),
  ]);

  if (existing) {
    await db.lessonReviewMark.delete({ where: { id: existing.id } });
  } else {
    await db.lessonReviewMark.create({ data: { userId: session.user.id, lessonId } });
  }
  if (lesson) {
    await logActivity(
      session.user.id,
      existing ? "LESSON_UNMARKED_REVIEW" : "LESSON_MARKED_REVIEW",
      lesson.title,
      `/learn/${lessonId}`
    );
  }

  revalidatePath(`/learn/${lessonId}`);
  revalidatePath("/study-hub/review");
  return { error: null, marked: !existing };
}

export async function toggleExternalLessonReviewAction(lessonId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const lesson = await assertOwnedLesson(session.user.id, lessonId);
  if (!lesson) return { error: "Aula não encontrada." };

  const markedForReview = !lesson.markedForReview;
  await db.externalLesson.update({
    where: { id: lessonId },
    data: { markedForReview },
  });
  await logActivity(
    session.user.id,
    markedForReview ? "LESSON_MARKED_REVIEW" : "LESSON_UNMARKED_REVIEW",
    lesson.title,
    `/study-hub/courses/${lesson.module.courseId}/lessons/${lessonId}`
  );

  revalidatePath(`/study-hub/courses/${lesson.module.courseId}`);
  revalidatePath(`/study-hub/courses/${lesson.module.courseId}/lessons/${lessonId}`);
  revalidatePath("/study-hub/review");
  return { error: null };
}

export async function recordExternalLessonViewAction(lessonId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const lesson = await assertOwnedLesson(session.user.id, lessonId);
  if (!lesson) return { error: "Aula não encontrada." };

  await db.externalLesson.update({
    where: { id: lessonId },
    data: { lastAccessedAt: new Date() },
  });

  return { error: null };
}

export async function searchStudyHubAction(query: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Sessão expirada.", results: { nativeLessons: [], externalLessons: [] } };
  }

  const results = await searchStudyHub(session.user.id, query);
  return { error: null, results };
}

export async function previewImportFromTextAction(input: ImportTextInput) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada.", preview: null };

  const parsed = importTextSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Cole o texto do curso.", preview: null };
  }

  const result = parseCourseText(parsed.data.rawText);
  if (result.error || !result.data) {
    return { error: result.error ?? "Não consegui interpretar o texto.", preview: null };
  }

  return { error: null, preview: result.data };
}

export async function previewImportFromJsonAction(input: ImportJsonInput) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada.", preview: null };

  const parsed = importJsonSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Cole o JSON do curso.", preview: null };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(parsed.data.rawJson);
  } catch {
    return { error: "JSON inválido — verifique a sintaxe (vírgulas, chaves, aspas).", preview: null };
  }

  return buildPreviewFromJsonPayload(raw);
}

export async function previewImportFromAiAction(input: GenerateWithAiInput) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada.", preview: null };

  const parsed = generateWithAiSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", preview: null };
  }

  const provider = getGeminiProvider();

  let answer: string;
  try {
    answer = await provider.generateCourseOutline({ topic: parsed.data.topic });
  } catch (error) {
    logger.error("study hub AI course generation failed", { error: String(error) });
    return { error: "A IA não respondeu agora. Tente novamente em instantes.", preview: null };
  }

  const jsonText = answer
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch {
    return {
      error: "A IA não retornou uma estrutura válida. Tente novamente ou reformule o tópico.",
      preview: null,
    };
  }

  return buildPreviewFromJsonPayload(raw);
}

export async function commitExternalCourseImportAction(input: CommitImportInput) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada.", courseId: null };

  const parsed = commitImportSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", courseId: null };
  }

  const duplicate = await db.externalCourse.findFirst({
    where: { userId: session.user.id, title: parsed.data.title },
  });
  if (duplicate) {
    return {
      error: `Você já tem um curso chamado "${parsed.data.title}". Renomeie um dos dois antes de importar de novo.`,
      courseId: null,
    };
  }

  const course = await db.externalCourse.create({
    data: {
      userId: session.user.id,
      title: parsed.data.title,
      modules: {
        create: parsed.data.modules.map((courseModule, moduleIndex) => ({
          title: courseModule.title,
          order: moduleIndex + 1,
          lessons: {
            create: courseModule.lessons.map((lesson, lessonIndex) => ({
              title: lesson.title,
              order: lessonIndex + 1,
            })),
          },
        })),
      },
    },
  });
  await logActivity(session.user.id, "COURSE_STARTED", course.title, `/study-hub/courses/${course.id}`);

  revalidatePath("/study-hub");
  revalidatePath("/study-hub/courses");
  return { error: null, courseId: course.id };
}
