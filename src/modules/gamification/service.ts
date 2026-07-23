import { db } from "@/lib/db";
import { getTotalStudyMinutes } from "@/modules/study-sessions/queries";
import { computeStreak } from "@/modules/study-sessions/streak";
import { BADGE_CATALOG, type BadgeCode } from "./badges";

export async function awardXp(
  userId: string,
  kind: string,
  points: number,
  ref?: { type: string; id: string }
) {
  await db.experienceEvent.create({
    data: { userId, kind, points, refType: ref?.type, refId: ref?.id },
  });
}

export async function getXpAndLevel(userId: string) {
  const result = await db.experienceEvent.aggregate({
    where: { userId },
    _sum: { points: true },
  });
  const totalXp = result._sum.points ?? 0;
  const level = 1 + Math.floor(totalXp / 100);
  const xpIntoLevel = totalXp % 100;
  return { totalXp, level, xpIntoLevel, xpForNextLevel: 100 };
}

async function hasBadge(userId: string, code: BadgeCode) {
  const badge = await db.badge.findUnique({ where: { code } });
  if (!badge) return true; // catálogo não seedado ainda — não tenta conceder
  const existing = await db.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
  });
  return Boolean(existing);
}

async function grantBadge(userId: string, code: BadgeCode) {
  const badge = await db.badge.findUnique({ where: { code } });
  if (!badge) return;
  await db.userBadge.upsert({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
    update: {},
    create: { userId, badgeId: badge.id },
  });
}

export async function seedBadgeCatalog() {
  for (const badge of BADGE_CATALOG) {
    await db.badge.upsert({
      where: { code: badge.code },
      update: { name: badge.name, description: badge.description, icon: badge.icon },
      create: badge,
    });
  }
}

/**
 * Reavalia as condições de todos os badges para o usuário e concede os que ainda não têm.
 * Idempotente (upsert por userId+badgeId) — seguro de chamar após qualquer ação relevante.
 */
export async function checkAndAwardBadges(userId: string) {
  const newlyAwarded: BadgeCode[] = [];

  async function maybeAward(code: BadgeCode, conditionMet: boolean) {
    if (!conditionMet) return;
    if (await hasBadge(userId, code)) return;
    await grantBadge(userId, code);
    newlyAwarded.push(code);
  }

  const [
    checklistTotal,
    checklistDone,
    lessonCount,
    labCount,
    projectCount,
    deployCount,
    quizCount,
    dockerDone,
    totalMinutes,
    sessionDates,
  ] = await Promise.all([
    db.checklistItem.count(),
    db.checklistItemProgress.count({ where: { userId, done: true } }),
    db.lessonCompletion.count({ where: { userId } }),
    db.laboratoryCompletion.count({ where: { userId } }),
    db.projectSubmission.count({ where: { userId } }),
    db.projectSubmission.count({ where: { userId, deployUrl: { not: null } } }),
    db.assessmentAttempt.count({ where: { userId } }),
    db.checklistItemProgress.findFirst({
      where: { userId, done: true, checklistItem: { label: { contains: "Docker", mode: "insensitive" } } },
    }),
    getTotalStudyMinutes(userId),
    db.studySession.findMany({ where: { userId, endedAt: { not: null } }, select: { startedAt: true } }),
  ]);

  const streak = computeStreak(sessionDates.map((s) => s.startedAt));

  await maybeAward("ambiente_preparado", checklistTotal > 0 && checklistDone === checklistTotal);
  await maybeAward("primeira_aula", lessonCount >= 1);
  await maybeAward("primeiro_laboratorio", labCount >= 1);
  await maybeAward("primeiro_projeto", projectCount >= 1);
  await maybeAward("primeiro_deploy", deployCount >= 1);
  await maybeAward("primeiro_teste", quizCount >= 1);
  await maybeAward("primeiro_container", Boolean(dockerDone));
  await maybeAward("sequencia_30_dias", streak >= 30);
  await maybeAward("100_horas", totalMinutes >= 6000);

  return newlyAwarded;
}
