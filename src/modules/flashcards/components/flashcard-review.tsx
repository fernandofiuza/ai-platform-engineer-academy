"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reviewFlashcardAction } from "@/modules/flashcards/actions";

type DueCard = {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  lesson: { title: string } | null;
};

const QUALITY_OPTIONS = [
  { value: 1, label: "Não lembrei" },
  { value: 3, label: "Difícil" },
  { value: 4, label: "Bom" },
  { value: 5, label: "Fácil" },
];

export function FlashcardReviewDeck({ initialCards }: { initialCards: DueCard[] }) {
  const router = useRouter();
  const [prevInitialCards, setPrevInitialCards] = React.useState(initialCards);
  const [queue, setQueue] = React.useState(initialCards);
  const [revealed, setRevealed] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  if (initialCards !== prevInitialCards) {
    setPrevInitialCards(initialCards);
    setQueue(initialCards);
    setRevealed(false);
  }

  const current = queue[0];

  function onRate(quality: number) {
    if (!current) return;
    startTransition(async () => {
      const result = await reviewFlashcardAction({ flashcardId: current.id, quality });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setQueue((prev) => prev.slice(1));
      setRevealed(false);
      router.refresh();
    });
  }

  if (!current) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="size-5 text-primary" /> Tudo revisado por hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Volte amanhã para a próxima rodada de revisão espaçada.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Flashcard</CardTitle>
          <Badge variant="secondary">{queue.length} restante(s)</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="font-medium">{current.question}</p>
          {revealed ? (
            <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">{current.answer}</p>
          ) : null}
        </div>

        {current.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {current.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}

        {!revealed ? (
          <Button onClick={() => setRevealed(true)}>
            <RotateCcw className="size-4" /> Revelar resposta
          </Button>
        ) : (
          <div className="flex flex-wrap gap-2">
            {QUALITY_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant="outline"
                onClick={() => onRate(option.value)}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {option.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
