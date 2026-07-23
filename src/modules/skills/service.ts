import { db } from "@/lib/db";

/**
 * Nível de competência é derivado da quantidade de evidências (aulas concluídas ligadas à
 * competência via LessonSkill), nunca definido manualmente pelo estudante — para não parecer
 * uma autoavaliação ou certificação oficial (ver Etapa 17 do prompt original).
 */
function levelForEvidenceCount(count: number) {
  if (count <= 0) return "NOT_STARTED" as const;
  if (count === 1) return "INTRO" as const;
  if (count === 2) return "PRACTICING" as const;
  return "COMPETENT" as const;
}

export async function recomputeSkillsForLesson(userId: string, lessonId: string) {
  const lessonSkills = await db.lessonSkill.findMany({ where: { lessonId } });

  for (const link of lessonSkills) {
    const evidenceCount = await db.lessonCompletion.count({
      where: {
        userId,
        lesson: { lessonSkills: { some: { skillId: link.skillId } } },
      },
    });

    await db.userSkillProgress.upsert({
      where: { userId_skillId: { userId, skillId: link.skillId } },
      update: { level: levelForEvidenceCount(evidenceCount) },
      create: { userId, skillId: link.skillId, level: levelForEvidenceCount(evidenceCount) },
    });
  }
}
