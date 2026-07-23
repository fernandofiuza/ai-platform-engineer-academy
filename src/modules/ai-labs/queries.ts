import { db } from "@/lib/db";

export async function getDepartments() {
  return db.department.findMany({ orderBy: { order: "asc" } });
}

export async function getArchitectureMilestones() {
  return db.architectureMilestone.findMany({
    where: { track: "AI_LABS" },
    orderBy: { order: "asc" },
  });
}
