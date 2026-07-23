"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";
import { updateWeekAction } from "@/modules/admin-curriculum/actions";
import { STATUS_LABELS } from "@/modules/curriculum/status";
import type { ContentStatus } from "@/generated/prisma/enums";

const STATUSES: ContentStatus[] = ["DRAFT", "PLANNED", "AVAILABLE", "IN_PROGRESS", "COMPLETED", "ARCHIVED"];

export function WeekEditForm({
  weekId,
  initialTitle,
  initialObjective,
  initialStatus,
}: {
  weekId: string;
  initialTitle: string;
  initialObjective: string;
  initialStatus: ContentStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [title, setTitle] = React.useState(initialTitle);
  const [objective, setObjective] = React.useState(initialObjective);
  const [status, setStatus] = React.useState<ContentStatus>(initialStatus);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateWeekAction({ weekId, title, objective, status });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Semana atualizada.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="week-title">Título</Label>
          <Input id="week-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="week-objective">Objetivo</Label>
        <Textarea
          id="week-objective"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          rows={2}
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Salvar
      </Button>
    </form>
  );
}
