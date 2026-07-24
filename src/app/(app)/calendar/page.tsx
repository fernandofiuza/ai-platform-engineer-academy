import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLessonSchedule, getStudyPlan } from "@/modules/planning/queries";
import { getSessionsInRange } from "@/modules/study-sessions/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Calendário" };

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const today = new Date();
  const year = params.year ? Number(params.year) : today.getFullYear();
  const month = params.month ? Number(params.month) - 1 : today.getMonth();

  const session = await auth();
  const userId = session!.user.id;

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);

  const [sessions, plan, schedule] = await Promise.all([
    getSessionsInRange(userId, monthStart, monthEnd),
    getStudyPlan(userId),
    getLessonSchedule(userId),
  ]);

  const minutesByDay = new Map<number, number>();
  for (const s of sessions) {
    const day = s.startedAt.getDate();
    minutesByDay.set(day, (minutesByDay.get(day) ?? 0) + (s.durationMinutes ?? 0));
  }

  const lessonsByDay = new Map<
    number,
    { completed: { title: string; weekNumber: number }[]; scheduled: { title: string; weekNumber: number; lessonId: string }[] }
  >();
  for (const item of schedule?.items ?? []) {
    if (item.date < monthStart || item.date >= monthEnd) continue;
    const day = item.date.getDate();
    const entry = lessonsByDay.get(day) ?? { completed: [], scheduled: [] };
    if (item.status === "completed") {
      entry.completed.push({ title: item.title, weekNumber: item.weekNumber });
    } else {
      entry.scheduled.push({ title: item.title, weekNumber: item.weekNumber, lessonId: item.lessonId });
    }
    lessonsByDay.set(day, entry);
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = monthStart.getDay();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = month === 0 ? { year: year - 1, month: 12 } : { year, month };
  const nextMonth = month === 11 ? { year: year + 1, month: 1 } : { year, month: month + 2 };

  const totalMinutes = [...minutesByDay.values()].reduce((a, b) => a + b, 0);
  const plannedDays = plan?.availableDays ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendário</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {MONTH_NAMES[month]} {year} — {Math.round(totalMinutes / 60)}h estudadas no mês
            {plan ? `, planejado para dias ${plannedDays.map((d) => WEEKDAY_LABELS[d]).join(", ")}` : ""}.
          </p>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/calendar?year=${prevMonth.year}&month=${prevMonth.month}`}>
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link href={`/calendar?year=${nextMonth.year}&month=${nextMonth.month}`}>
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label}>{label}</div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              const isPlannedDay = day !== null && plannedDays.includes(new Date(year, month, day).getDay());
              const minutes = day ? minutesByDay.get(day) : undefined;
              const isToday = day !== null && sameDay(new Date(year, month, day), today);
              const dayLessons = day ? lessonsByDay.get(day) : undefined;
              const completedCount = dayLessons?.completed.length ?? 0;
              const scheduledCount = dayLessons?.scheduled.length ?? 0;

              const titleAttr = dayLessons
                ? [
                    ...dayLessons.completed.map((l) => `✓ Concluída: Semana ${l.weekNumber} — ${l.title}`),
                    ...dayLessons.scheduled.map((l) => `→ Planejada: Semana ${l.weekNumber} — ${l.title}`),
                  ].join("\n")
                : undefined;

              const cellContent = (
                <div
                  title={titleAttr}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md border text-xs",
                    day === null && "border-transparent",
                    day !== null && isPlannedDay && "bg-accent/40",
                    isToday && "border-primary",
                    minutes || dayLessons ? "font-medium" : "text-muted-foreground"
                  )}
                >
                  {day ? (
                    <>
                      <span>{day}</span>
                      {minutes ? <span className="text-[10px] text-primary">{minutes}min</span> : null}
                      {completedCount > 0 ? (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                          ✓ {completedCount}
                        </span>
                      ) : null}
                      {scheduledCount > 0 ? (
                        <span className="text-[10px] text-blue-600 dark:text-blue-400">
                          → {scheduledCount}
                        </span>
                      ) : null}
                    </>
                  ) : null}
                </div>
              );

              if (day && scheduledCount === 1 && completedCount === 0) {
                return (
                  <Link key={i} href={`/learn/${dayLessons!.scheduled[0].lessonId}`}>
                    {cellContent}
                  </Link>
                );
              }
              return <div key={i}>{cellContent}</div>;
            })}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Dias com fundo destacado são dias planejados no seu{" "}
        <Link href="/planner" className="underline">
          planejador
        </Link>
        . O número em minutos mostra o que foi realmente estudado (via{" "}
        <Link href="/sessions" className="underline">
          sessões de estudo
        </Link>
        ); <span className="text-emerald-600 dark:text-emerald-400">✓</span> conta aulas concluídas
        nesse dia e <span className="text-blue-600 dark:text-blue-400">→</span> conta aulas
        agendadas automaticamente pelo cronograma dinâmico — passe o mouse sobre o dia para ver
        quais.
      </p>
    </div>
  );
}
