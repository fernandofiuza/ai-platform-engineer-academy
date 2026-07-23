import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getStudyPlan } from "@/modules/planning/queries";
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

  const [sessions, plan] = await Promise.all([
    getSessionsInRange(userId, monthStart, monthEnd),
    getStudyPlan(userId),
  ]);

  const minutesByDay = new Map<number, number>();
  const sessionsByDay = new Map<number, number>();
  for (const s of sessions) {
    const day = s.startedAt.getDate();
    minutesByDay.set(day, (minutesByDay.get(day) ?? 0) + (s.durationMinutes ?? 0));
    sessionsByDay.set(day, (sessionsByDay.get(day) ?? 0) + 1);
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
              const isToday =
                day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              return (
                <div
                  key={i}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center rounded-md border text-xs",
                    day === null && "border-transparent",
                    day !== null && isPlannedDay && "bg-accent/40",
                    isToday && "border-primary",
                    minutes ? "font-medium" : "text-muted-foreground"
                  )}
                >
                  {day ? (
                    <>
                      <span>{day}</span>
                      {minutes ? (
                        <span className="text-[10px] text-primary">{minutes}min</span>
                      ) : null}
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Dias com fundo destacado são dias planejados no seu{" "}
        <Link href="/planner" className="underline">
          planejador
        </Link>
        ; o número em cada dia mostra os minutos realmente estudados (via{" "}
        <Link href="/sessions" className="underline">
          sessões de estudo
        </Link>
        ).
      </p>
    </div>
  );
}
