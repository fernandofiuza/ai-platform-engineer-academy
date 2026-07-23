import { db } from "@/lib/db";

export async function getDueFlashcardsForUser(userId: string) {
  const flashcards = await db.flashcard.findMany({
    include: {
      reviews: {
        where: { userId },
        orderBy: { reviewedAt: "desc" },
        take: 1,
      },
      lesson: true,
    },
  });

  const now = new Date();
  return flashcards
    .filter((card) => {
      const lastReview = card.reviews[0];
      return !lastReview || lastReview.nextReviewAt <= now;
    })
    .map((card) => ({ ...card, lastReview: card.reviews[0] ?? null }));
}

export async function getFlashcardStatsForUser(userId: string) {
  const total = await db.flashcard.count();
  const dueCards = await getDueFlashcardsForUser(userId);
  const reviewedTotal = await db.flashcardReview.count({ where: { userId } });
  return { total, due: dueCards.length, reviewedTotal };
}

export async function getLastReview(userId: string, flashcardId: string) {
  return db.flashcardReview.findFirst({
    where: { userId, flashcardId },
    orderBy: { reviewedAt: "desc" },
  });
}
