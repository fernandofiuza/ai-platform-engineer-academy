import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Clock } from "lucide-react";

import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getLessonsForLearnPage } from "@/modules/curriculum/queries";
import { formatScheduleDate, stripWeekDayPrefix } from "@/modules/planning/format";
import { getLessonSchedule } from "@/modules/planning/queries";

export const metadata: Metadata = { title: "Aprender" };

export default async function LearnPage() {
  const [session, lessons] = await Promise.all([auth(), getLessonsForLearnPage()]);

  const [completions, schedule] = await Promise.all([
    session?.user
      ? db.lessonCompletion.findMany({
          where: { userId: session.user.id, lessonId: { in: lessons.map((l) => l.id) } },
        })
      : Promise.resolve([]),
    session?.user ? getLessonSchedule(session.user.id) : Promise.resolve(null),
  ]);
  const completedIds = new Set(completions.map((c) => c.lessonId));

  if (lessons.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Nenhuma aula disponível ainda</CardTitle>
          <CardDescription>
            A grade semanal completa ainda está em construção — acompanhe pelo{" "}
            <Link href="/roadmap" className="underline">
              Roadmap
            </Link>
            .
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!schedule) {
    return (
      <div className="space-y-6">
        <LearnHeader hasSchedule={false} />
        <div className="grid gap-4 sm:grid-cols-2">
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              isCompleted={completedIds.has(lesson.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  const scheduleByLessonId = new Map(schedule.items.map((i) => [i.lessonId, i]));
  const groups = new Map<string, { date: Date; lessons: typeof lessons }>();
  for (const lesson of lessons) {
    const entry = scheduleByLessonId.get(lesson.id);
    const date = entry?.date ?? new Date(0);
    const key = date.toDateString();
    if (!groups.has(key)) groups.set(key, { date, lessons: [] });
    groups.get(key)!.lessons.push(lesson);
  }
  const sortedGroups = [...groups.values()].sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="space-y-6">
      <LearnHeader hasSchedule />

      <div className="space-y-6">
        {sortedGroups.map((group) => {
          const allCompleted = group.lessons.every((l) => completedIds.has(l.id));
          return (
            <div key={group.date.toDateString()}>
              <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                {allCompleted ? (
                  <CheckCircle2 className="size-4 text-primary" />
                ) : (
                  <Clock className="size-4" />
                )}
                {formatScheduleDate(group.date, "long")}
              </h2>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {group.lessons.map((lesson) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    isCompleted={completedIds.has(lesson.id)}
                    paceWeekIndex={scheduleByLessonId.get(lesson.id)?.paceWeekIndex}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LearnHeader({ hasSchedule }: { hasSchedule: boolean }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Aprender</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasSchedule ? (
          <>
            Aulas organizadas pelas datas reais do seu cronograma — configure ou ajuste sua
            disponibilidade no{" "}
            <Link href="/planner" className="underline">
              Planejador
            </Link>{" "}
            para recalcular.
          </>
        ) : (
          <>
            Aulas das 104 semanas da formação. Configure seu{" "}
            <Link href="/planner" className="underline">
              Planejador
            </Link>{" "}
            para ver aqui as datas reais de cada aula.
          </>
        )}
      </p>
    </div>
  );
}

type LessonSummary = {
  id: string;
  title: string;
  durationMinutes: number | null;
  isDemo: boolean;
  week: { number: number; phase: { label: string } | null };
};

function LessonCard({
  lesson,
  isCompleted,
  paceWeekIndex,
}: {
  lesson: LessonSummary;
  isCompleted: boolean;
  paceWeekIndex?: number;
}) {
  return (
    <Link href={`/learn/${lesson.id}`}>
      <Card className="h-full transition-colors hover:bg-accent/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <BookOpen className="size-5" />
            </span>
            <div className="min-w-0">
              <CardTitle className="text-base">
                {paceWeekIndex ? stripWeekDayPrefix(lesson.title) : lesson.title}
              </CardTitle>
              <CardDescription>
                Semana {paceWeekIndex ?? lesson.week.number}
                {lesson.week.phase ? ` · ${lesson.week.phase.label}` : ""}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            {lesson.durationMinutes ? (
              <>
                <Clock className="size-3.5" /> {lesson.durationMinutes} min
              </>
            ) : null}
          </span>
          <span className="flex items-center gap-2">
            {lesson.isDemo ? <Badge variant="secondary">demonstrativa</Badge> : null}
            {isCompleted ? <Badge>concluída</Badge> : <ArrowRight className="size-4" />}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
