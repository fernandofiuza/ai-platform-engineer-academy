import { db } from "@/lib/db";

export async function getAllWeeksForAdmin() {
  return db.week.findMany({
    orderBy: { number: "asc" },
    include: { phase: true, _count: { select: { lessons: true } } },
  });
}

export async function getWeekWithLessonsForAdmin(weekId: string) {
  return db.week.findUnique({
    where: { id: weekId },
    include: {
      phase: true,
      lessons: {
        orderBy: { order: "asc" },
        include: {
          flashcards: true,
          assessments: { include: { questions: { include: { options: true } } } },
          laboratories: {
            orderBy: { laboratory: { createdAt: "asc" } },
            include: { laboratory: true },
          },
        },
      },
      productMilestone: true,
    },
  });
}
