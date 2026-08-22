import { Prisma } from "@/generated/prisma/client";
import type { ActivityType } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

export async function logActivity(
  userId: string,
  type: ActivityType,
  title: string,
  href?: string,
  metadata?: Record<string, unknown>
) {
  await db.activityLogEntry.create({
    data: { userId, type, title, href, metadata: metadata as Prisma.InputJsonValue },
  });
}

export async function getActivityHistory(userId: string, limit = 100) {
  return db.activityLogEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
