import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ListChecks } from "lucide-react";

import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RoadmapExplorer } from "@/modules/curriculum/components/roadmap-explorer";
import {
  getChecklistProgressForUser,
  getProgramWithPhasesAndWeeks,
  getWeekById,
} from "@/modules/curriculum/queries";
import { getLessonSchedule } from "@/modules/planning/queries";

export const metadata: Metadata = { title: "Roadmap" };

export default async function RoadmapPage() {
  const [session, program] = await Promise.all([auth(), getProgramWithPhasesAndWeeks()]);

  if (!program) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Currículo ainda não importado</CardTitle>
          <CardDescription>
            Rode <code className="rounded bg-muted px-1 py-0.5">npm run curriculum:import</code> para
            gerar o roadmap a partir de <code className="rounded bg-muted px-1 py-0.5">Curso.md</code>.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const weekZero = program.weeks[0] ?? null;
  let weekZeroPercent = 0;
  let weekZeroTotal = 0;
  let weekZeroDone = 0;

  if (weekZero && session?.user) {
    const week = await getWeekById(weekZero.id);
    weekZeroTotal = week?.checklistItems.length ?? 0;
    if (weekZeroTotal > 0) {
      const progress = await getChecklistProgressForUser(session.user.id, weekZero.id);
      weekZeroDone = [...progress.values()].filter((p) => p.done).length;
      weekZeroPercent = Math.round((weekZeroDone / weekZeroTotal) * 100);
    }
  }

  const totalWeeks = program.phases.reduce((acc, phase) => acc + phase.weeks.length, 0);
  const definedWeeks = program.phases.reduce(
    (acc, phase) => acc + phase.weeks.filter((w) => w.status !== "PLANNED").length,
    0
  );

  const schedule = session?.user ? await getLessonSchedule(session.user.id) : null;
  const dateRangeByWeekNumber = new Map<number, { start: Date; end: Date }>();
  for (const item of schedule?.items ?? []) {
    const existing = dateRangeByWeekNumber.get(item.weekNumber);
    if (!existing) {
      dateRangeByWeekNumber.set(item.weekNumber, { start: item.date, end: item.date });
    } else {
      if (item.date < existing.start) existing.start = item.date;
      if (item.date > existing.end) existing.end = item.date;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Roadmap</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {program.name} — {program.totalWeeks} semanas em {program.phases.length} semestres.{" "}
          {definedWeeks} de {totalWeeks} semanas já têm conteúdo definido; as demais estão
          marcadas como <Badge variant="secondary">Planejado</Badge>.
        </p>
      </div>

      {weekZero ? (
        <Link href={`/roadmap/${weekZero.id}`}>
          <Card className="transition-colors hover:bg-accent/50">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <ListChecks className="size-5" />
                  </span>
                  <div>
                    <CardTitle>{weekZero.title}</CardTitle>
                    <CardDescription>Checklist de preparação do ambiente</CardDescription>
                  </div>
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            {weekZeroTotal > 0 ? (
              <CardContent>
                <div className="flex items-center gap-3">
                  <Progress value={weekZeroPercent} className="h-2" />
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {weekZeroDone}/{weekZeroTotal} ({weekZeroPercent}%)
                  </span>
                </div>
              </CardContent>
            ) : null}
          </Card>
        </Link>
      ) : null}

      <RoadmapExplorer
        phases={program.phases}
        dateRangeByWeekNumber={Object.fromEntries(
          [...dateRangeByWeekNumber.entries()].map(([weekNumber, range]) => [
            weekNumber,
            { start: range.start.toISOString(), end: range.end.toISOString() },
          ])
        )}
      />
    </div>
  );
}
