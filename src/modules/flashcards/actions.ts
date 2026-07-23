"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardXp } from "@/modules/gamification/service";
import { computeNextReview } from "./sm2";
import { getLastReview } from "./queries";
import { reviewFlashcardSchema, type ReviewFlashcardInput } from "./schema";

export async function reviewFlashcardAction(input: ReviewFlashcardInput) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const parsed = reviewFlashcardSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };

  const flashcard = await db.flashcard.findUnique({ where: { id: parsed.data.flashcardId } });
  if (!flashcard) return { error: "Flashcard não encontrado." };

  const lastReview = await getLastReview(session.user.id, parsed.data.flashcardId);
  const previous = lastReview
    ? {
        intervalDays: lastReview.intervalDays,
        easeFactor: lastReview.easeFactor,
        reviewCount: await db.flashcardReview.count({
          where: { userId: session.user.id, flashcardId: parsed.data.flashcardId },
        }),
      }
    : null;

  const { intervalDays, easeFactor, nextReviewAt } = computeNextReview(
    parsed.data.quality,
    previous
  );

  await db.flashcardReview.create({
    data: {
      userId: session.user.id,
      flashcardId: parsed.data.flashcardId,
      quality: parsed.data.quality,
      intervalDays,
      easeFactor,
      nextReviewAt,
    },
  });

  await awardXp(session.user.id, "flashcard_reviewed", 2, {
    type: "Flashcard",
    id: parsed.data.flashcardId,
  });

  revalidatePath("/flashcards");
  return { error: null, nextReviewAt, intervalDays };
}
