import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Briefcase, BookOpen, Rocket } from "lucide-react";

import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EnvironmentChecklist } from "@/modules/curriculum/components/environment-checklist";
import { getChecklistProgressForUser, getWeekById } from "@/modules/curriculum/queries";
import { STATUS_BADGE_VARIANT, STATUS_LABELS } from "@/modules/curriculum/status";
import { formatScheduleDate } from "@/modules/planning/format";
import { getLessonSchedule } from "@/modules/planning/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ weekId: string }>;
}): Promise<Metadata> {
  const { weekId } = await params;
  const week = await getWeekById(weekId);
  return { title: week ? week.title : "Semana" };
}

export default async function WeekDetailPage({
  params,
}: {
  params: Promise<{ weekId: string }>;
}) {
  const { weekId } = await params;
  const [session, week] = await Promise.all([auth(), getWeekById(weekId)]);

  if (!week) {
    notFound();
  }

  const schedule = session?.user ? await getLessonSchedule(session.user.id) : null;
  const scheduleByLessonId = new Map((schedule?.items ?? []).map((i) => [i.lessonId, i]));

  if (week.isEnvironmentSetup) {
    const progressMap = session?.user
      ? await getChecklistProgressForUser(session.user.id, week.id)
      : new Map();

    const initialProgress: Record<
      string,
      { done: boolean; note: string; evidenceUrl: string; installedVersion: string; reviewNeeded: boolean }
    > = {};
    for (const item of week.checklistItems) {
      const p = progressMap.get(item.id);
      initialProgress[item.id] = {
        done: p?.done ?? false,
        note: p?.note ?? "",
        evidenceUrl: p?.evidenceUrl ?? "",
        installedVersion: p?.installedVersion ?? "",
        reviewNeeded: p?.reviewNeeded ?? false,
      };
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{week.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Marque cada item conforme for preparando seu ambiente. Seu progresso é salvo
            automaticamente.
          </p>
        </div>
        <EnvironmentChecklist items={week.checklistItems} initialProgress={initialProgress} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Semana {week.number}</span>
          {week.phase ? (
            <>
              <span>·</span>
              <span>
                {week.phase.label}: {week.phase.name}
              </span>
            </>
          ) : null}
        </div>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{week.title}</h1>
          <Badge variant={STATUS_BADGE_VARIANT[week.status]}>{STATUS_LABELS[week.status]}</Badge>
        </div>
        {week.objective ? (
          <p className="mt-2 text-sm text-muted-foreground">{week.objective}</p>
        ) : null}
      </div>

      {week.status === "PLANNED" ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Conteúdo detalhado ainda não definido</CardTitle>
            <CardDescription>
              Esta semana faz parte da estrutura das 104 semanas da formação, mas o conteúdo
              específico ainda não foi definido em <code className="rounded bg-muted px-1 py-0.5">Curso.md</code>.
              Será preenchido pela área administrativa quando o módulo correspondente for
              planejado.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {week.productMilestone?.track === "PROFESSIONAL" ? (
              <>
                <Briefcase className="size-4" /> Trilha Profissional
              </>
            ) : (
              <>
                <Rocket className="size-4" /> Trilha Produto (APEX Academy)
              </>
            )}
          </CardTitle>
          {week.productMilestone ? (
            <CardDescription className="flex items-center gap-2">
              <Badge variant={STATUS_BADGE_VARIANT[week.productMilestone.status]}>
                {STATUS_LABELS[week.productMilestone.status]}
              </Badge>
              <span>
                {week.productMilestone.title}
                {week.productMilestone.description ? ` — ${week.productMilestone.description}` : ""}
              </span>
            </CardDescription>
          ) : (
            <CardDescription>
              A definir — nenhum marco de trilha (produto ou profissional) vinculado a esta semana
              ainda.
            </CardDescription>
          )}
        </CardHeader>
      </Card>

      {week.lessons.length > 0 ? (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">Aulas</h2>
          <div className="mt-2 divide-y rounded-lg border">
            {week.lessons.map((lesson) => {
              const entry = scheduleByLessonId.get(lesson.id);
              return (
                <Link
                  key={lesson.id}
                  href={`/learn/${lesson.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-accent/50"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="size-4 text-muted-foreground" />
                    {lesson.title}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {entry ? (
                      <Badge variant={entry.status === "completed" ? "default" : "outline"}>
                        {formatScheduleDate(entry.date)}
                      </Badge>
                    ) : null}
                    <ArrowRight className="size-4" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
