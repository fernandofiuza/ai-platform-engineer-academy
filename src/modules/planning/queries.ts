import { db } from "@/lib/db";

export async function getStudyPlan(userId: string) {
  return db.studyPlan.findUnique({ where: { userId } });
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
