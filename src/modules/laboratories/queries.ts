import { db } from "@/lib/db";

export async function getLaboratories() {
  return db.laboratory.findMany({
    where: { status: "AVAILABLE" },
    orderBy: { createdAt: "asc" },
  });
}

export async function getLaboratoryById(id: string) {
  return db.laboratory.findUnique({ where: { id } });
}

export async function getCompletionForUser(userId: string, laboratoryId: string) {
  return db.laboratoryCompletion.findUnique({
    where: { userId_laboratoryId: { userId, laboratoryId } },
  });
}

export async function getAllLaboratoriesForAdmin() {
  return db.laboratory.findMany({ orderBy: { createdAt: "asc" } });
}
