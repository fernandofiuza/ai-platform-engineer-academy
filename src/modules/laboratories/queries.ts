import { db } from "@/lib/db";

const lessonsInclude = {
  lessons: {
    orderBy: [
      { lesson: { week: { number: "asc" as const } } },
      { lesson: { order: "asc" as const } },
    ],
    include: { lesson: { include: { week: { include: { phase: true } } } } },
  },
};

export async function getLaboratories() {
  return db.laboratory.findMany({
    where: { status: "AVAILABLE" },
    orderBy: { createdAt: "asc" },
    include: lessonsInclude,
  });
}

export async function getLaboratoryById(id: string) {
  return db.laboratory.findUnique({ where: { id }, include: lessonsInclude });
}

export async function getCompletionForUser(userId: string, laboratoryId: string) {
  return db.laboratoryCompletion.findUnique({
    where: { userId_laboratoryId: { userId, laboratoryId } },
  });
}

export async function getAllLaboratoriesForAdmin() {
  return db.laboratory.findMany({ orderBy: { createdAt: "asc" }, include: lessonsInclude });
}

export async function getLaboratoriesForLesson(lessonId: string) {
  return db.laboratory.findMany({
    where: { lessons: { some: { lessonId } } },
    orderBy: { createdAt: "asc" },
  });
}
