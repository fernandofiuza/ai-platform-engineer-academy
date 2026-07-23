import { db } from "@/lib/db";

export async function getSkillsWithProgress(userId: string) {
  const skills = await db.skill.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: {
      userProgress: { where: { userId } },
      lessonSkills: {
        include: {
          lesson: {
            include: { completions: { where: { userId } } },
          },
        },
      },
    },
  });

  return skills.map((skill) => {
    const evidenceLessons = skill.lessonSkills
      .filter((ls) => ls.lesson.completions.length > 0)
      .map((ls) => ({ id: ls.lesson.id, title: ls.lesson.title }));

    return {
      id: skill.id,
      name: skill.name,
      category: skill.category,
      description: skill.description,
      level: skill.userProgress[0]?.level ?? "NOT_STARTED",
      evidenceLessons,
    };
  });
}
