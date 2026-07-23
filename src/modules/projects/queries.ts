import { db } from "@/lib/db";

export async function getProjects() {
  return db.project.findMany({
    where: { status: "AVAILABLE" },
    orderBy: { createdAt: "asc" },
  });
}

export async function getProjectById(id: string) {
  return db.project.findUnique({ where: { id } });
}

export async function getSubmissionForUser(userId: string, projectId: string) {
  return db.projectSubmission.findUnique({
    where: { userId_projectId: { userId, projectId } },
    include: { codeReviews: { orderBy: { createdAt: "desc" } } },
  });
}

export async function getAllProjectsForAdmin() {
  return db.project.findMany({ orderBy: { createdAt: "asc" } });
}
