"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Loader2, Rocket, Save } from "lucide-react";
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
import { saveMilestoneAction } from "@/modules/admin-curriculum/actions";
import { STATUS_LABELS } from "@/modules/curriculum/status";
import type { ContentStatus } from "@/generated/prisma/enums";

const STATUSES: ContentStatus[] = ["DRAFT", "PLANNED", "AVAILABLE", "IN_PROGRESS", "COMPLETED", "ARCHIVED"];

type Track = "PRODUCT" | "PROFESSIONAL";

const TRACK_LABELS: Record<Track, string> = {
  PRODUCT: "Trilha Produto (APEX Academy)",
  PROFESSIONAL: "Trilha Profissional",
};

const TRACK_HELP: Record<Track, string> = {
  PRODUCT: "O que foi implementado no produto APEX Academy nesta semana.",
  PROFESSIONAL: "Qual habilidade de mercado/carreira é trabalhada nesta semana.",
};

export function ProductMilestoneForm({
  weekId,
  initialTrack,
  initialTitle,
  initialDescription,
  initialStatus,
}: {
  weekId: string;
  initialTrack: Track | null;
  initialTitle: string;
  initialDescription: string;
  initialStatus: ContentStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [track, setTrack] = React.useState<Track>(initialTrack ?? "PRODUCT");
  const [title, setTitle] = React.useState(initialTitle);
  const [description, setDescription] = React.useState(initialDescription);
  const [status, setStatus] = React.useState<ContentStatus>(initialStatus);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveMilestoneAction({
        weekId,
        track,
        title,
        description: description || undefined,
        status,
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Marco de trilha salvo.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        {track === "PRODUCT" ? <Rocket className="size-4" /> : <Briefcase className="size-4" />}
        {TRACK_LABELS[track]}
      </div>
      <p className="text-xs text-muted-foreground">
        {TRACK_HELP[track]} Cada semana só pode ter um marco no total — trocar a trilha aqui
        substitui um marco da outra trilha que já existisse nesta semana.
      </p>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Trilha</Label>
            <Select value={track} onValueChange={(v) => setTrack(v as Track)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRODUCT">Produto</SelectItem>
                <SelectItem value="PROFESSIONAL">Profissional</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
          Salvar marco
        </Button>
      </form>
    </div>
  );
}
