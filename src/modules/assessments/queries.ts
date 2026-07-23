import { db } from "@/lib/db";

export async function getAssessments() {
  return db.assessment.findMany({
    where: { status: "AVAILABLE" },
    include: { lesson: true, questions: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getAssessmentById(id: string) {
  return db.assessment.findUnique({
    where: { id },
    include: {
      lesson: true,
      questions: { orderBy: { order: "asc" }, include: { options: { orderBy: { order: "asc" } } } },
    },
  });
}

export async function getAttemptsForUser(userId: string, assessmentId: string) {
  return db.assessmentAttempt.findMany({
    where: { userId, assessmentId },
    orderBy: { startedAt: "desc" },
  });
}
