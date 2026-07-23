"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { completeLessonAction } from "@/modules/curriculum/actions";

const CONFIDENCE_LABELS: Record<number, string> = {
  1: "1 — Não entendi",
  2: "2 — Entendi pouco",
  3: "3 — Entendi razoavelmente",
  4: "4 — Entendi bem",
  5: "5 — Domino o assunto",
};

export function LessonCompleteForm({
  lessonId,
  initialCompletion,
}: {
  lessonId: string;
  initialCompletion: {
    confidence: number | null;
    whatLearned: string | null;
    whatUnclear: string | null;
    completedAt: Date | null;
  } | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [confidence, setConfidence] = React.useState(
    String(initialCompletion?.confidence ?? 3)
  );
  const [whatLearned, setWhatLearned] = React.useState(initialCompletion?.whatLearned ?? "");
  const [whatUnclear, setWhatUnclear] = React.useState(initialCompletion?.whatUnclear ?? "");

  const isCompleted = Boolean(initialCompletion?.completedAt);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await completeLessonAction({
        lessonId,
        confidence: Number(confidence),
        whatLearned: whatLearned || undefined,
        whatUnclear: whatUnclear || undefined,
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isCompleted ? "Reflexão atualizada." : "Aula concluída!");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="confidence">Nível de confiança</Label>
        <Select value={confidence} onValueChange={setConfidence}>
          <SelectTrigger id="confidence" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {CONFIDENCE_LABELS[n]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="whatLearned">O que aprendi</Label>
        <Textarea
          id="whatLearned"
          value={whatLearned}
          onChange={(e) => setWhatLearned(e.target.value)}
          placeholder="Resuma o que ficou claro para você"
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="whatUnclear">O que ainda não entendi</Label>
        <Textarea
          id="whatUnclear"
          value={whatUnclear}
          onChange={(e) => setWhatUnclear(e.target.value)}
          placeholder="Opcional — registre dúvidas para revisar depois"
          rows={3}
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <CheckCircle2 className="size-4" />
        )}
        {isCompleted ? "Atualizar reflexão" : "Concluir aula"}
      </Button>
    </form>
  );
}
