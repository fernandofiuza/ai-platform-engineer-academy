import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlashcardReviewDeck } from "@/modules/flashcards/components/flashcard-review";
import { getDueFlashcardsForUser, getFlashcardStatsForUser } from "@/modules/flashcards/queries";

export const metadata: Metadata = { title: "Flashcards" };

export default async function FlashcardsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [dueCards, stats] = await Promise.all([
    getDueFlashcardsForUser(userId),
    getFlashcardStatsForUser(userId),
  ]);

  if (stats.total === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Nenhum flashcard disponível ainda</CardTitle>
          <CardDescription>
            Flashcards de demonstração chegam junto com o conteúdo do currículo.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Flashcards</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Revisão espaçada (SM-2 simplificado) — {stats.due} de {stats.total} cartões para revisar
          agora.
        </p>
      </div>

      <FlashcardReviewDeck
        initialCards={dueCards.map((c) => ({
          id: c.id,
          question: c.question,
          answer: c.answer,
          tags: c.tags,
          lesson: c.lesson,
        }))}
      />
    </div>
  );
}
