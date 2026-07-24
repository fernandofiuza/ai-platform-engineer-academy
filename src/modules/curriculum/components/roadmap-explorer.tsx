"use client";

import * as React from "react";
import Link from "next/link";
import { Briefcase, List, Map as MapIcon, GanttChart, GraduationCap, Rocket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { STATUS_BADGE_VARIANT, STATUS_LABELS } from "@/modules/curriculum/status";
import type { ContentStatus } from "@/generated/prisma/enums";

type WeekSummary = {
  id: string;
  number: number;
  title: string;
  status: ContentStatus;
  productMilestone: { title: string; status: ContentStatus; track: string } | null;
};

type PhaseSummary = {
  id: string;
  order: number;
  name: string;
  label: string;
  status: ContentStatus;
  weeks: WeekSummary[];
};

type TrackWeek = { id: string; number: number; title: string; status: ContentStatus };

const ALL_STATUSES: (ContentStatus | "ALL")[] = [
  "ALL",
  "DRAFT",
  "PLANNED",
  "AVAILABLE",
  "IN_PROGRESS",
  "COMPLETED",
  "ARCHIVED",
];

type TrackKey = "FORMACAO" | "PRODUTO" | "PROFISSIONAL";

export function RoadmapExplorer({ phases }: { phases: PhaseSummary[] }) {
  const [track, setTrack] = React.useState<TrackKey>("FORMACAO");
  const [phaseFilter, setPhaseFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  const trackPhases: { id: string; order: number; name: string; label: string; weeks: TrackWeek[] }[] =
    phases.map((phase) => ({
      id: phase.id,
      order: phase.order,
      name: phase.name,
      label: phase.label,
      weeks: phase.weeks.map((week) => {
        if (track === "FORMACAO") {
          return { id: week.id, number: week.number, title: week.title, status: week.status };
        }
        const wantedTrack = track === "PRODUTO" ? "PRODUCT" : "PROFESSIONAL";
        const milestone = week.productMilestone?.track === wantedTrack ? week.productMilestone : null;
        return {
          id: week.id,
          number: week.number,
          title:
            milestone?.title ??
            (track === "PRODUTO" ? "Trilha Produto — a definir" : "Trilha Profissional — a definir"),
          status: milestone?.status ?? "PLANNED",
        };
      }),
    }));

  const filteredPhases = trackPhases
    .filter((phase) => phaseFilter === "ALL" || phase.id === phaseFilter)
    .map((phase) => ({
      ...phase,
      weeks: phase.weeks.filter(
        (week) => statusFilter === "ALL" || week.status === statusFilter
      ),
    }));

  return (
    <div className="space-y-4">
      <Tabs value={track} onValueChange={(v) => setTrack(v as TrackKey)}>
        <TabsList>
          <TabsTrigger value="FORMACAO">
            <GraduationCap className="size-4" /> Trilha Formação
          </TabsTrigger>
          <TabsTrigger value="PRODUTO">
            <Rocket className="size-4" /> Trilha Produto
          </TabsTrigger>
          <TabsTrigger value="PROFISSIONAL">
            <Briefcase className="size-4" /> Trilha Profissional
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {track === "PRODUTO" ? (
        <p className="text-sm text-muted-foreground">
          Evolução do produto &ldquo;APEX Academy&rdquo; (o SaaS construído pelo aluno ao longo da
          formação) — distinto da AI Labs. Semanas sem marco definido aparecem como &ldquo;a
          definir&rdquo;.
        </p>
      ) : null}
      {track === "PROFISSIONAL" ? (
        <p className="text-sm text-muted-foreground">
          Habilidades de mercado e carreira trabalhadas ao longo da formação (comunicação com
          cliente, documentação, code review, portfólio, entrevista técnica, e mais). Semanas sem
          marco definido aparecem como &ldquo;a definir&rdquo;.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Select value={phaseFilter} onValueChange={setPhaseFilter}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Fase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os semestres</SelectItem>
            {phases.map((phase) => (
              <SelectItem key={phase.id} value={phase.id}>
                {phase.label}: {phase.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {ALL_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status === "ALL" ? "Todos os status" : STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">
            <List className="size-4" /> Lista
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <GanttChart className="size-4" /> Timeline
          </TabsTrigger>
          <TabsTrigger value="map">
            <MapIcon className="size-4" /> Mapa por semestre
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4 space-y-6">
          {filteredPhases.map((phase) => (
            <div key={phase.id}>
              <h3 className="text-sm font-medium text-muted-foreground">
                {phase.label} — {phase.name}
              </h3>
              <div className="mt-2 divide-y rounded-lg border">
                {phase.weeks.map((week) => (
                  <Link
                    key={week.id}
                    href={`/roadmap/${week.id}`}
                    className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm hover:bg-accent/50"
                  >
                    <span>
                      <span className="text-muted-foreground">Semana {week.number}</span>{" "}
                      — {week.title}
                    </span>
                    <Badge variant={STATUS_BADGE_VARIANT[week.status]}>
                      {STATUS_LABELS[week.status]}
                    </Badge>
                  </Link>
                ))}
                {phase.weeks.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground">
                    Nenhuma semana com esse filtro.
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="timeline" className="mt-4 space-y-6">
          {filteredPhases.map((phase) => (
            <div key={phase.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {phase.order}
                </span>
                <span className="mt-1 w-px flex-1 bg-border" />
              </div>
              <div className="flex-1 pb-6">
                <p className="text-sm font-medium">
                  {phase.label} — {phase.name}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {phase.weeks.map((week) => (
                    <Link key={week.id} href={`/roadmap/${week.id}`} title={week.title}>
                      <span
                        className={cn(
                          "flex size-7 items-center justify-center rounded-md border text-[11px] font-medium transition-colors hover:border-primary",
                          week.status === "PLANNED" && "bg-muted text-muted-foreground",
                          week.status !== "PLANNED" && "bg-primary/10 text-primary"
                        )}
                      >
                        {week.number}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="map" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPhases.map((phase) => {
              const total = phase.weeks.length;
              const defined = phase.weeks.filter((w) => w.status !== "PLANNED").length;
              return (
                <Card key={phase.id}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {phase.label}: {phase.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>{total} semanas</p>
                    <p>{defined} com conteúdo definido</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
