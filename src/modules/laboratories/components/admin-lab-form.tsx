"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Archive, ChevronDown, Loader2, Plus, Save } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { archiveLaboratoryAction, saveLaboratoryAction } from "@/modules/laboratories/actions";
import { STATUS_LABELS } from "@/modules/curriculum/status";
import type { ContentStatus } from "@/generated/prisma/enums";

const STATUSES: ContentStatus[] = ["DRAFT", "PLANNED", "AVAILABLE", "IN_PROGRESS", "COMPLETED", "ARCHIVED"];

type Laboratory = {
  id: string;
  title: string;
  objective: string | null;
  environment: string | null;
  prerequisites: string[];
  instructions: string | null;
  commands: string | null;
  expectedResult: string | null;
  validation: string | null;
  troubleshooting: string | null;
  status: ContentStatus;
  lesson: { title: string; week: { number: number } } | null;
};

function toLines(value: string) {
  return value.split("\n").map((l) => l.trim()).filter(Boolean);
}

export function AdminLabForm({ laboratory }: { laboratory?: Laboratory }) {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState(!laboratory);
  const [isPending, startTransition] = React.useTransition();
  const [title, setTitle] = React.useState(laboratory?.title ?? "");
  const [objective, setObjective] = React.useState(laboratory?.objective ?? "");
  const [environment, setEnvironment] = React.useState(laboratory?.environment ?? "");
  const [prerequisites, setPrerequisites] = React.useState(laboratory?.prerequisites.join("\n") ?? "");
  const [instructions, setInstructions] = React.useState(laboratory?.instructions ?? "");
  const [commands, setCommands] = React.useState(laboratory?.commands ?? "");
  const [expectedResult, setExpectedResult] = React.useState(laboratory?.expectedResult ?? "");
  const [validation, setValidation] = React.useState(laboratory?.validation ?? "");
  const [troubleshooting, setTroubleshooting] = React.useState(laboratory?.troubleshooting ?? "");
  const [status, setStatus] = React.useState<ContentStatus>(laboratory?.status ?? "PLANNED");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveLaboratoryAction({
        laboratoryId: laboratory?.id,
        title,
        objective: objective || undefined,
        environment: environment || undefined,
        prerequisites: toLines(prerequisites),
        instructions: instructions || undefined,
        commands: commands || undefined,
        expectedResult: expectedResult || undefined,
        validation: validation || undefined,
        troubleshooting: troubleshooting || undefined,
        status,
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(laboratory ? "Laboratório atualizado." : "Laboratório criado.");
      router.refresh();
    });
  }

  function onArchive() {
    if (!laboratory) return;
    startTransition(async () => {
      await archiveLaboratoryAction(laboratory.id);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader
        className="cursor-pointer flex-row items-center justify-between gap-2 space-y-0"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{laboratory ? laboratory.title : "Novo laboratório"}</span>
          {laboratory ? <Badge variant="secondary">{STATUS_LABELS[laboratory.status]}</Badge> : null}
          {laboratory?.lesson ? (
            <span className="text-xs text-muted-foreground">
              Semana {laboratory.lesson.week.number} — {laboratory.lesson.title}
            </span>
          ) : null}
        </div>
        <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
      </CardHeader>
      {expanded ? (
        <CardContent onClick={(e) => e.stopPropagation()}>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Objetivo</Label>
                <Textarea value={objective} onChange={(e) => setObjective(e.target.value)} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Ambiente</Label>
                <Textarea value={environment} onChange={(e) => setEnvironment(e.target.value)} rows={2} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Pré-requisitos (um por linha)</Label>
              <Textarea value={prerequisites} onChange={(e) => setPrerequisites(e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Instruções</Label>
              <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Comandos</Label>
              <Textarea value={commands} onChange={(e) => setCommands(e.target.value)} rows={2} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Resultado esperado</Label>
                <Textarea value={expectedResult} onChange={(e) => setExpectedResult(e.target.value)} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Validação</Label>
                <Textarea value={validation} onChange={(e) => setValidation(e.target.value)} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Troubleshooting</Label>
                <Textarea
                  value={troubleshooting}
                  onChange={(e) => setTroubleshooting(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <div className="flex items-end gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus)}>
                  <SelectTrigger className="w-48">
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
              <Button type="submit" disabled={isPending || !title}>
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : laboratory ? (
                  <Save className="size-4" />
                ) : (
                  <Plus className="size-4" />
                )}
                {laboratory ? "Salvar" : "Criar"}
              </Button>
              {laboratory ? (
                <Button type="button" variant="ghost" onClick={onArchive} disabled={isPending}>
                  <Archive className="size-4" /> Arquivar
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      ) : null}
    </Card>
  );
}
