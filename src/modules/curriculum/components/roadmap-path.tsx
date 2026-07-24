"use client";

import Link from "next/link";
import { CheckCircle2, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import { extractModuleName } from "@/modules/curriculum/module-name";

type ScheduleItem = {
  lessonId: string;
  weekNumber: number;
  status: "completed" | "scheduled";
  curriculumIndex: number;
};

type WeekSummary = {
  id: string;
  number: number;
  title: string;
  status: string;
};

type PhaseSummary = {
  id: string;
  order: number;
  name: string;
  label: string;
  weeks: WeekSummary[];
};

type ModuleNode = {
  id: string;
  name: string;
  status: "completed" | "in-progress" | "planned";
  isCurrent: boolean;
};

function buildModules(
  weeks: WeekSummary[],
  scheduleByWeek: Map<number, { completed: number; total: number }> | null,
  currentWeekNumber: number | null
): ModuleNode[] {
  const modules: ModuleNode[] = [];
  let current: { id: string; name: string; weekNumbers: number[] } | null = null;

  for (const week of weeks) {
    const name = extractModuleName(week.title);
    if (current && current.name === name) {
      current.weekNumbers.push(week.number);
    } else {
      if (current) modules.push(finalizeModule(current, scheduleByWeek, currentWeekNumber));
      current = { id: week.id, name, weekNumbers: [week.number] };
    }
  }
  if (current) modules.push(finalizeModule(current, scheduleByWeek, currentWeekNumber));

  return modules;
}

function finalizeModule(
  group: { id: string; name: string; weekNumbers: number[] },
  scheduleByWeek: Map<number, { completed: number; total: number }> | null,
  currentWeekNumber: number | null
): ModuleNode {
  let status: ModuleNode["status"] = "planned";
  if (scheduleByWeek) {
    let completed = 0;
    let total = 0;
    for (const wn of group.weekNumbers) {
      const entry = scheduleByWeek.get(wn);
      if (entry) {
        completed += entry.completed;
        total += entry.total;
      }
    }
    if (total > 0 && completed === total) status = "completed";
    else if (completed > 0) status = "in-progress";
  }

  const isCurrent = currentWeekNumber !== null && group.weekNumbers.includes(currentWeekNumber);

  return { id: group.id, name: group.name, status, isCurrent };
}

const STATUS_DOT: Record<ModuleNode["status"], string> = {
  completed: "bg-primary border-primary",
  "in-progress": "bg-primary/40 border-primary",
  planned: "bg-background border-border",
};

const STATUS_CARD: Record<ModuleNode["status"], string> = {
  completed: "border-primary/40 bg-primary/5",
  "in-progress": "border-primary/40",
  planned: "",
};

export function RoadmapPath({
  phases,
  scheduleItems,
}: {
  phases: PhaseSummary[];
  scheduleItems?: ScheduleItem[];
}) {
  const scheduleByWeek = scheduleItems
    ? scheduleItems.reduce((map, item) => {
        const entry = map.get(item.weekNumber) ?? { completed: 0, total: 0 };
        entry.total += 1;
        if (item.status === "completed") entry.completed += 1;
        map.set(item.weekNumber, entry);
        return map;
      }, new Map<number, { completed: number; total: number }>())
    : null;

  const nextPending = scheduleItems
    ?.filter((i) => i.status === "scheduled")
    .sort((a, b) => a.curriculumIndex - b.curriculumIndex)[0];
  const currentWeekNumber = nextPending?.weekNumber ?? null;

  return (
    <div className="relative mx-auto max-w-2xl py-2">
      <div className="absolute left-[23px] top-2 bottom-2 w-0.5 bg-border" aria-hidden />

      {phases.map((phase) => {
        const modules = buildModules(phase.weeks, scheduleByWeek, currentWeekNumber);
        return (
          <div key={phase.id}>
            <div className="relative flex items-center gap-4 py-3">
              <div className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground ring-4 ring-background">
                {phase.order}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {phase.label}
                </p>
                <p className="font-semibold">{phase.name}</p>
              </div>
            </div>

            <div className="ml-6 space-y-2.5 border-l-2 border-transparent pb-5 pl-8">
              {modules.map((module) => (
                <Link key={module.id} href={`/roadmap/${module.id}`} className="relative block">
                  <span
                    className={cn(
                      "absolute -left-[2.55rem] top-1/2 size-4 -translate-y-1/2 rounded-full border-2 ring-4 ring-background",
                      STATUS_DOT[module.status]
                    )}
                    aria-hidden
                  />
                  <div
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg border p-3 text-sm transition-colors hover:border-primary",
                      STATUS_CARD[module.status]
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {module.status === "completed" ? (
                        <CheckCircle2 className="size-4 shrink-0 text-primary" />
                      ) : null}
                      <p className="font-medium">{module.name}</p>
                    </div>
                    {module.isCurrent ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                        <MapPin className="size-3" /> Você está aqui
                      </span>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
