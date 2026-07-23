import { db } from "@/lib/db";

export async function getAllBadgesWithUserStatus(userId: string) {
  const badges = await db.badge.findMany({ orderBy: { createdAt: "asc" } });
  const userBadges = await db.userBadge.findMany({ where: { userId } });
  const earnedByBadgeId = new Map(userBadges.map((ub) => [ub.badgeId, ub.earnedAt]));

  return badges.map((badge) => ({
    ...badge,
    earnedAt: earnedByBadgeId.get(badge.id) ?? null,
  }));
}
