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
import { archiveProjectAction, saveProjectAction } from "@/modules/projects/actions";
import { STATUS_LABELS } from "@/modules/curriculum/status";
import type { ContentStatus } from "@/generated/prisma/enums";

const STATUSES: ContentStatus[] = ["DRAFT", "PLANNED", "AVAILABLE", "IN_PROGRESS", "COMPLETED", "ARCHIVED"];

type Project = {
  id: string;
  title: string;
  problem: string | null;
  context: string | null;
  objective: string | null;
  requirements: string[];
  optionalRequirements: string[];
  deliverables: string[];
  acceptanceCriteria: string[];
  status: ContentStatus;
};

function toLines(value: string) {
  return value.split("\n").map((l) => l.trim()).filter(Boolean);
}

export function AdminProjectForm({ project }: { project?: Project }) {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState(!project);
  const [isPending, startTransition] = React.useTransition();
  const [title, setTitle] = React.useState(project?.title ?? "");
  const [problem, setProblem] = React.useState(project?.problem ?? "");
  const [context, setContext] = React.useState(project?.context ?? "");
  const [objective, setObjective] = React.useState(project?.objective ?? "");
  const [requirements, setRequirements] = React.useState(project?.requirements.join("\n") ?? "");
  const [optionalRequirements, setOptionalRequirements] = React.useState(
    project?.optionalRequirements.join("\n") ?? ""
  );
  const [deliverables, setDeliverables] = React.useState(project?.deliverables.join("\n") ?? "");
  const [acceptanceCriteria, setAcceptanceCriteria] = React.useState(
    project?.acceptanceCriteria.join("\n") ?? ""
  );
  const [status, setStatus] = React.useState<ContentStatus>(project?.status ?? "PLANNED");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveProjectAction({
        projectId: project?.id,
        title,
        problem: problem || undefined,
        context: context || undefined,
        objective: objective || undefined,
        requirements: toLines(requirements),
        optionalRequirements: toLines(optionalRequirements),
        deliverables: toLines(deliverables),
        acceptanceCriteria: toLines(acceptanceCriteria),
        status,
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(project ? "Projeto atualizado." : "Projeto criado.");
      router.refresh();
    });
  }

  function onArchive() {
    if (!project) return;
    startTransition(async () => {
      await archiveProjectAction(project.id);
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
          <span className="text-sm font-medium">{project ? project.title : "Novo projeto"}</span>
          {project ? <Badge variant="secondary">{STATUS_LABELS[project.status]}</Badge> : null}
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
                <Label>Problema</Label>
                <Textarea value={problem} onChange={(e) => setProblem(e.target.value)} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Contexto</Label>
                <Textarea value={context} onChange={(e) => setContext(e.target.value)} rows={2} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Objetivo</Label>
              <Textarea value={objective} onChange={(e) => setObjective(e.target.value)} rows={2} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Requisitos (um por linha)</Label>
                <Textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label>Requisitos opcionais (um por linha)</Label>
                <Textarea
                  value={optionalRequirements}
                  onChange={(e) => setOptionalRequirements(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Entregáveis (um por linha)</Label>
                <Textarea value={deliverables} onChange={(e) => setDeliverables(e.target.value)} rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label>Critérios de aceite (um por linha)</Label>
                <Textarea
                  value={acceptanceCriteria}
                  onChange={(e) => setAcceptanceCriteria(e.target.value)}
                  rows={3}
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
                ) : project ? (
                  <Save className="size-4" />
                ) : (
                  <Plus className="size-4" />
                )}
                {project ? "Salvar" : "Criar"}
              </Button>
              {project ? (
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
