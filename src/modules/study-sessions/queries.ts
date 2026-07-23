import { db } from "@/lib/db";

export async function getActiveSession(userId: string) {
  return db.studySession.findFirst({
    where: { userId, endedAt: null },
    include: { lesson: true },
  });
}

export async function getSessionHistory(userId: string, limit = 20) {
  return db.studySession.findMany({
    where: { userId, endedAt: { not: null } },
    orderBy: { startedAt: "desc" },
    take: limit,
    include: { lesson: true },
  });
}

export async function getSessionsInRange(userId: string, start: Date, end: Date) {
  return db.studySession.findMany({
    where: {
      userId,
      endedAt: { not: null },
      startedAt: { gte: start, lt: end },
    },
    orderBy: { startedAt: "asc" },
  });
}

export async function getTotalStudyMinutes(userId: string) {
  const result = await db.studySession.aggregate({
    where: { userId, endedAt: { not: null } },
    _sum: { durationMinutes: true },
  });
  return result._sum.durationMinutes ?? 0;
}
