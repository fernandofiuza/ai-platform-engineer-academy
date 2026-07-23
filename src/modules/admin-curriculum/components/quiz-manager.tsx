"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { addQuestionAction, deleteQuestionAction } from "@/modules/admin-curriculum/actions";

type Question = {
  id: string;
  prompt: string;
  options: { id: string; text: string; isCorrect: boolean }[];
};

export function QuizManager({
  lessonId,
  weekId,
  questions,
}: {
  lessonId: string;
  weekId: string;
  questions: Question[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [prompt, setPrompt] = React.useState("");
  const [options, setOptions] = React.useState([
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);

  function updateOptionText(index: number, text: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, text } : o)));
  }

  function setCorrect(index: number) {
    setOptions((prev) => prev.map((o, i) => ({ ...o, isCorrect: i === index })));
  }

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await addQuestionAction({
        lessonId,
        prompt,
        options: options.filter((o) => o.text.trim()),
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setPrompt("");
      setOptions([
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ]);
      router.refresh();
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      await deleteQuestionAction(id, weekId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Quiz</p>
      {questions.map((q) => (
        <div key={q.id} className="rounded-md border px-2.5 py-1.5 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span>{q.prompt}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Excluir pergunta"
              onClick={() => onDelete(q.id)}
              disabled={isPending}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
          <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
            {q.options.map((o) => (
              <li key={o.id}>
                {o.isCorrect ? "✓ " : "· "}
                {o.text}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <form onSubmit={onAdd} className="space-y-2 rounded-md border p-2.5">
        <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Pergunta" />
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <Checkbox
              checked={option.isCorrect}
              onCheckedChange={() => setCorrect(index)}
              aria-label={`Marcar opção ${index + 1} como correta`}
            />
            <Input
              value={option.text}
              onChange={(e) => updateOptionText(index, e.target.value)}
              placeholder={`Opção ${index + 1}`}
            />
          </div>
        ))}
        <Button type="submit" size="sm" disabled={isPending || !prompt}>
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
          Adicionar pergunta
        </Button>
      </form>
    </div>
  );
}
