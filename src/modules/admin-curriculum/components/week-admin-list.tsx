"use client";

import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_BADGE_VARIANT, STATUS_LABELS } from "@/modules/curriculum/status";
import type { ContentStatus } from "@/generated/prisma/enums";

type WeekRow = {
  id: string;
  number: number;
  title: string;
  status: ContentStatus;
  phase: { label: string; name: string } | null;
  _count: { lessons: number };
};

const ALL_STATUSES: (ContentStatus | "ALL")[] = [
  "ALL",
  "DRAFT",
  "PLANNED",
  "AVAILABLE",
  "IN_PROGRESS",
  "COMPLETED",
  "ARCHIVED",
];

export function WeekAdminList({ weeks }: { weeks: WeekRow[] }) {
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  const filtered = weeks.filter((w) => statusFilter === "ALL" || w.status === statusFilter);

  return (
    <div className="space-y-4">
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

      <div className="divide-y rounded-lg border">
        {filtered.map((week) => (
          <Link
            key={week.id}
            href={`/admin/curriculum/${week.id}`}
            className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm hover:bg-accent/50"
          >
            <span>
              <span className="text-muted-foreground">Semana {week.number}</span> — {week.title}
              {week.phase ? (
                <span className="ml-2 text-xs text-muted-foreground">
                  {week.phase.label}: {week.phase.name}
                </span>
              ) : null}
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <Badge variant="outline">{week._count.lessons} aula(s)</Badge>
              <Badge variant={STATUS_BADGE_VARIANT[week.status]}>{STATUS_LABELS[week.status]}</Badge>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
