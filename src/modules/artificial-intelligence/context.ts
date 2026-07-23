import { db } from "@/lib/db";
import type { AIContext } from "./types";

export async function buildContextForUser(
  userId: string,
  currentLessonId?: string
): Promise<AIContext> {
  const [currentLesson, completions, goals, attempts] = await Promise.all([
    currentLessonId ? db.lesson.findUnique({ where: { id: currentLessonId } }) : null,
    db.lessonCompletion.findMany({ where: { userId }, include: { lesson: true } }),
    db.studyGoal.findMany({ where: { userId, status: "OPEN" }, orderBy: { targetDate: "asc" } }),
    db.assessmentAttempt.findMany({
      where: { userId, score: { not: null } },
      orderBy: { startedAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    currentLessonTitle: currentLesson?.title,
    currentLessonContent: currentLesson?.contentMarkdown ?? undefined,
    completedLessonTitles: completions.map((c) => c.lesson.title),
    openGoalTitles: goals.map((g) => g.title),
    recentQuizScores: attempts.map((a) => a.score ?? 0),
  };
}
