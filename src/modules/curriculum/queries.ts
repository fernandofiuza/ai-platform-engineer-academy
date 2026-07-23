import { db } from "@/lib/db";
import { PROGRAM_SLUG } from "@/modules/curriculum-import/service";

export async function getProgramWithPhasesAndWeeks() {
  return db.program.findUnique({
    where: { slug: PROGRAM_SLUG },
    include: {
      phases: {
        orderBy: { order: "asc" },
        include: { weeks: { orderBy: { number: "asc" } } },
      },
      weeks: {
        where: { isEnvironmentSetup: true },
        orderBy: { number: "asc" },
      },
    },
  });
}

export async function getWeekById(weekId: string) {
  return db.week.findUnique({
    where: { id: weekId },
    include: {
      phase: true,
      program: true,
      lessons: { orderBy: { order: "asc" } },
      checklistItems: { orderBy: [{ category: "asc" }, { order: "asc" }] },
    },
  });
}

export async function getChecklistProgressForUser(userId: string, weekId: string) {
  const rows = await db.checklistItemProgress.findMany({
    where: { userId, checklistItem: { weekId } },
  });
  return new Map(rows.map((row) => [row.checklistItemId, row]));
}

export async function getLessonsForLearnPage() {
  return db.lesson.findMany({
    where: { status: "AVAILABLE" },
    orderBy: [{ week: { number: "asc" } }, { order: "asc" }],
    include: { week: { include: { phase: true } } },
  });
}

export async function getLessonById(lessonId: string) {
  return db.lesson.findUnique({
    where: { id: lessonId },
    include: { week: { include: { phase: true } }, resources: true },
  });
}

export async function getLessonCompletion(userId: string, lessonId: string) {
  return db.lessonCompletion.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });
}

export async function getLatestImportJob() {
  return db.importJob.findFirst({
    orderBy: { startedAt: "desc" },
    include: { warnings: true },
  });
}
