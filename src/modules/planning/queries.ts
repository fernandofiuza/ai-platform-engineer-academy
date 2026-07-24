import { db } from "@/lib/db";
import { computeLessonSchedule, type LessonScheduleResult } from "./schedule";

export async function getStudyPlan(userId: string) {
  return db.studyPlan.findUnique({ where: { userId } });
}

/**
 * Cronograma dinâmico de aulas do aluno — recalculado do zero a cada chamada a partir do
 * `StudyPlan` atual e das `LessonCompletion` reais (nunca persistido). Ver `./schedule.ts`.
 */
export async function getLessonSchedule(userId: string): Promise<LessonScheduleResult | null> {
  const plan = await db.studyPlan.findUnique({ where: { userId } });
  if (!plan) return null;

  const [lessons, completions] = await Promise.all([
    db.lesson.findMany({
      where: { status: "AVAILABLE" },
      orderBy: [{ week: { number: "asc" } }, { order: "asc" }],
      select: { id: true, title: true, durationMinutes: true, week: { select: { number: true } } },
    }),
    db.lessonCompletion.findMany({
      where: { userId },
      select: { lessonId: true, completedAt: true },
    }),
  ]);

  const completionsMap = new Map(completions.map((c) => [c.lessonId, c.completedAt]));

  return computeLessonSchedule({
    lessons,
    completions: completionsMap,
    availableDays: plan.availableDays,
    dailyHours: plan.dailyHours,
    startDate: plan.startDate,
  });
}

export async function getGoals(userId: string) {
  return db.studyGoal.findMany({
    where: { userId },
    orderBy: [{ status: "asc" }, { targetDate: "asc" }],
    include: { relatedWeek: true },
  });
}

export async function getWeekOptions() {
  return db.week.findMany({
    orderBy: { number: "asc" },
    select: { id: true, number: true, title: true },
  });
}
