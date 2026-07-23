"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addFlashcardAction, deleteFlashcardAction } from "@/modules/admin-curriculum/actions";

type Flashcard = { id: string; question: string; answer: string };

export function FlashcardManager({
  lessonId,
  weekId,
  flashcards,
}: {
  lessonId: string;
  weekId: string;
  flashcards: Flashcard[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [question, setQuestion] = React.useState("");
  const [answer, setAnswer] = React.useState("");

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await addFlashcardAction({ lessonId, question, answer, tags: [] });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setQuestion("");
      setAnswer("");
      router.refresh();
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      await deleteFlashcardAction(id, weekId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Flashcards</p>
      {flashcards.map((card) => (
        <div key={card.id} className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-sm">
          <span className="truncate">
            {card.question} → {card.answer}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Excluir flashcard"
            onClick={() => onDelete(card.id)}
            disabled={isPending}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}
      <form onSubmit={onAdd} className="flex flex-wrap gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Pergunta"
          className="min-w-40 flex-1"
        />
        <Input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Resposta"
          className="min-w-40 flex-1"
        />
        <Button type="submit" size="sm" disabled={isPending || !question || !answer}>
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
          Adicionar
        </Button>
      </form>
    </div>
  );
}
