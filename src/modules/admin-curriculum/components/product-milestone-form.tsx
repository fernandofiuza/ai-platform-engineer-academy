"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Rocket, Save } from "lucide-react";
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
import { saveProductMilestoneAction } from "@/modules/admin-curriculum/actions";
import { STATUS_LABELS } from "@/modules/curriculum/status";
import type { ContentStatus } from "@/generated/prisma/enums";

const STATUSES: ContentStatus[] = ["DRAFT", "PLANNED", "AVAILABLE", "IN_PROGRESS", "COMPLETED", "ARCHIVED"];

export function ProductMilestoneForm({
  weekId,
  initialTitle,
  initialDescription,
  initialStatus,
}: {
  weekId: string;
  initialTitle: string;
  initialDescription: string;
  initialStatus: ContentStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [title, setTitle] = React.useState(initialTitle);
  const [description, setDescription] = React.useState(initialDescription);
  const [status, setStatus] = React.useState<ContentStatus>(initialStatus);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveProductMilestoneAction({
        weekId,
        title,
        description: description || undefined,
        status,
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Marco da Trilha Produto salvo.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Rocket className="size-4" /> Trilha Produto (APEX Academy)
      </div>
      <p className="text-xs text-muted-foreground">
        O que foi implementado no produto APEX Academy nesta semana (opcional).
      </p>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="milestone-title">Título</Label>
            <Input
              id="milestone-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex.: Autenticação da área do aluno"
              required
            />
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
          <Label htmlFor="milestone-description">Descrição</Label>
          <Textarea
            id="milestone-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>
        <Button type="submit" size="sm" disabled={isPending || !title}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Salvar marco do produto
        </Button>
      </form>
    </div>
  );
}
