"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Archive, Check, ChevronDown, Loader2, Plus, Save, Sparkles } from "lucide-react";
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
import {
  approveLabContentAction,
  archiveLaboratoryAction,
  generateLabContentAction,
  saveLaboratoryAction,
} from "@/modules/laboratories/actions";
import { STATUS_LABELS } from "@/modules/curriculum/status";
import type { ContentStatus } from "@/generated/prisma/enums";

const STATUSES: ContentStatus[] = ["DRAFT", "PLANNED", "AVAILABLE", "IN_PROGRESS", "COMPLETED", "ARCHIVED"];

type Laboratory = {
  id: string;
  title: string;
  scenario: string | null;
  objective: string | null;
  environment: string | null;
  prerequisites: string[];
  instructions: string | null;
  commands: string | null;
  expectedResult: string | null;
  validation: string | null;
  troubleshooting: string | null;
  status: ContentStatus;
  aiGeneratedAt: Date | null;
  lessons: { lesson: { id: string; title: string; week: { number: number } } }[];
};

function toLines(value: string) {
  return value.split("\n").map((l) => l.trim()).filter(Boolean);
}

export function AdminLabForm({ laboratory }: { laboratory?: Laboratory }) {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState(!laboratory);
  const [isPending, startTransition] = React.useTransition();
  const [title, setTitle] = React.useState(laboratory?.title ?? "");
  const [scenario, setScenario] = React.useState(laboratory?.scenario ?? "");
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
        lessonIds: laboratory?.lessons.map((ll) => ll.lesson.id) ?? [],
        title,
        scenario: scenario || undefined,
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

  function onApprove() {
    if (!laboratory) return;
    startTransition(async () => {
      const result = await approveLabContentAction(laboratory.id);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Laboratório aprovado e publicado.");
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

  function onRegenerate(confirmOverwrite = false) {
    if (!laboratory || laboratory.lessons.length === 0) return;
    startTransition(async () => {
      const result = await generateLabContentAction({
        laboratoryId: laboratory.id,
        lessonIds: laboratory.lessons.map((ll) => ll.lesson.id),
        title: laboratory.title,
        scenario: laboratory.scenario ?? laboratory.title,
        confirmOverwrite,
      });
      if (result?.error) {
        if (result.needsConfirmation && window.confirm(`${result.error}\n\nGerar mesmo assim?`)) {
          onRegenerate(true);
          return;
        }
        toast.error(result.error);
        return;
      }
      toast.success("Laboratório gerado novamente por IA — revise e aprove.");
      router.refresh();
    });
  }

  const weekNumbers = laboratory
    ? [...new Set(laboratory.lessons.map((ll) => ll.lesson.week.number))].sort((a, b) => a - b)
    : [];

  return (
    <Card>
      <CardHeader
        className="cursor-pointer flex-row items-center justify-between gap-2 space-y-0"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{laboratory ? laboratory.title : "Novo laboratório"}</span>
          {laboratory ? <Badge variant="secondary">{STATUS_LABELS[laboratory.status]}</Badge> : null}
          {weekNumbers.length > 0 ? (
            <span className="text-xs text-muted-foreground">
              Semanas {weekNumbers.join(", ")} · {laboratory!.lessons.length} aula(s) vinculada(s)
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {laboratory && laboratory.lessons.length > 0 ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onRegenerate(false);
              }}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Gerar novamente com IA
            </Button>
          ) : null}
          {laboratory?.status === "DRAFT" ? (
            <Button
              type="button"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onApprove();
              }}
              disabled={isPending}
            >
              <Check className="size-4" /> Aprovar e publicar
            </Button>
          ) : null}
          <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
        </div>
      </CardHeader>
      {expanded ? (
        <CardContent onClick={(e) => e.stopPropagation()}>
          {laboratory && laboratory.lessons.length > 0 ? (
            <div className="mb-3 space-y-1 rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
              {laboratory.lessons.map((ll) => (
                <div key={ll.lesson.id}>
                  Semana {ll.lesson.week.number} — {ll.lesson.title}
                </div>
              ))}
            </div>
          ) : null}
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Cenário</Label>
              <Textarea
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                rows={2}
                placeholder="Situação de produção simulada (ex: subir uma API interna em Kubernetes para uma fintech)"
              />
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
              <Label>Instruções (objetivo, cenário, pré-requisitos, passos, validação, troubleshooting, resumo)</Label>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={20}
                className="font-mono text-xs"
              />
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
