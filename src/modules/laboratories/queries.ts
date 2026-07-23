import { db } from "@/lib/db";

const lessonInclude = {
  lesson: { include: { week: { include: { phase: true } } } },
} as const;

export async function getLaboratories() {
  return db.laboratory.findMany({
    where: { status: "AVAILABLE" },
    orderBy: { createdAt: "asc" },
    include: lessonInclude,
  });
}

export async function getLaboratoryById(id: string) {
  return db.laboratory.findUnique({ where: { id }, include: lessonInclude });
}

export async function getCompletionForUser(userId: string, laboratoryId: string) {
  return db.laboratoryCompletion.findUnique({
    where: { userId_laboratoryId: { userId, laboratoryId } },
  });
}

export async function getAllLaboratoriesForAdmin() {
  return db.laboratory.findMany({ orderBy: { createdAt: "asc" }, include: lessonInclude });
}

export async function getLaboratoriesForLesson(lessonId: string) {
  return db.laboratory.findMany({ where: { lessonId }, orderBy: { createdAt: "asc" } });
}
