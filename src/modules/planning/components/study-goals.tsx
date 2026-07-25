"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createGoalAction,
  deleteGoalAction,
  rescheduleGoalAction,
  setGoalStatusAction,
} from "@/modules/planning/actions";
import { parseDateInputValue, toDateInputValue } from "@/modules/planning/format";

type Goal = {
  id: string;
  title: string;
  targetDate: Date | null;
  status: "OPEN" | "DONE" | "CANCELLED";
  relatedWeek: { number: number; title: string } | null;
};

type WeekOption = { id: string; number: number; title: string };

export function StudyGoals({ goals, weekOptions }: { goals: Goal[]; weekOptions: WeekOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [title, setTitle] = React.useState("");
  const [targetDate, setTargetDate] = React.useState("");
  const [relatedWeekId, setRelatedWeekId] = React.useState<string>("");

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      const result = await createGoalAction({
        title,
        targetDate: targetDate ? parseDateInputValue(targetDate) : undefined,
        relatedWeekId: relatedWeekId || undefined,
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setTitle("");
      setTargetDate("");
      setRelatedWeekId("");
      router.refresh();
    });
  }

  function onSetStatus(goalId: string, status: "OPEN" | "DONE" | "CANCELLED") {
    startTransition(async () => {
      await setGoalStatusAction(goalId, status);
      router.refresh();
    });
  }

  function onReschedule(goalId: string, value: string) {
    if (!value) return;
    startTransition(async () => {
      await rescheduleGoalAction({ goalId, targetDate: parseDateInputValue(value) });
      router.refresh();
    });
  }

  function onDelete(goalId: string) {
    startTransition(async () => {
      await deleteGoalAction(goalId);
      router.refresh();
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-4">
      <form onSubmit={onCreate} className="flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1 space-y-1.5">
          <Label htmlFor="goal-title">Nova meta</Label>
          <Input
            id="goal-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Concluir a Semana 0"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="goal-date">Data alvo</Label>
          <Input
            id="goal-date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Semana relacionada</Label>
          <Select value={relatedWeekId} onValueChange={setRelatedWeekId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Nenhuma" />
            </SelectTrigger>
            <SelectContent>
              {weekOptions.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  Semana {w.number} — {w.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={isPending || !title.trim()}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Adicionar
        </Button>
      </form>

      {goals.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma meta cadastrada ainda.</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {goals.map((goal) => {
            const isOverdue =
              goal.status === "OPEN" && goal.targetDate && goal.targetDate < today;
            return (
              <div key={goal.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p
                    className={
                      goal.status !== "OPEN" ? "text-sm text-muted-foreground line-through" : "text-sm"
                    }
                  >
                    {goal.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {goal.targetDate ? (
                      <span>Até {goal.targetDate.toLocaleDateString("pt-BR")}</span>
                    ) : null}
                    {goal.relatedWeek ? <span>· Semana {goal.relatedWeek.number}</span> : null}
                    {isOverdue ? <Badge variant="outline">atrasada</Badge> : null}
                    {goal.status === "DONE" ? <Badge>concluída</Badge> : null}
                    {goal.status === "CANCELLED" ? <Badge variant="secondary">cancelada</Badge> : null}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {goal.status === "OPEN" ? (
                    <>
                      <Input
                        type="date"
                        className="h-8 w-36"
                        aria-label="Reagendar"
                        defaultValue={goal.targetDate ? toDateInputValue(goal.targetDate) : ""}
                        onChange={(e) => onReschedule(goal.id, e.target.value)}
                      />
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Marcar como concluída"
                        onClick={() => onSetStatus(goal.id, "DONE")}
                      >
                        <Check className="size-4" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Cancelar meta"
                        onClick={() => onSetStatus(goal.id, "CANCELLED")}
                      >
                        <X className="size-4" />
                      </Button>
                    </>
                  ) : null}
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Excluir meta"
                    onClick={() => onDelete(goal.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
