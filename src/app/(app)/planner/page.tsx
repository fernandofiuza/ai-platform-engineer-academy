import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, CalendarRange, Target } from "lucide-react";

import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StudyGoals } from "@/modules/planning/components/study-goals";
import { StudyPlanForm } from "@/modules/planning/components/study-plan-form";
import { formatDayNumber, stripWeekDayPrefix } from "@/modules/planning/format";
import { getGoals, getLessonSchedule, getStudyPlan, getWeekOptions } from "@/modules/planning/queries";

export const metadata: Metadata = { title: "Planejador de estudos" };

export default async function PlannerPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [plan, goals, weekOptions, schedule] = await Promise.all([
    getStudyPlan(userId),
    getGoals(userId),
    getWeekOptions(),
    getLessonSchedule(userId),
  ]);

  const nextUp = schedule?.items.filter((i) => i.status === "scheduled").slice(0, 5) ?? [];
  const progressPercent =
    schedule && schedule.totalCount > 0
      ? Math.round((schedule.completedCount / schedule.totalCount) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Planejador de estudos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure sua disponibilidade e acompanhe suas metas. Nada aqui pune atrasos — você
          pode reagendar quando precisar.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="size-4" /> Sua disponibilidade
          </CardTitle>
          <CardDescription>
            Dias da semana e carga horária usados para agendar automaticamente suas próximas
            aulas — mudar isso aqui recalcula o cronograma inteiro na hora.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudyPlanForm initialPlan={plan} />
        </CardContent>
      </Card>

      {schedule ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarRange className="size-4" /> Cronograma dinâmico
            </CardTitle>
            <CardDescription>
              Recalculado automaticamente a cada aula concluída — sem cronograma fixo. Aulas que
              não forem estudadas em um dia disponível são remarcadas sozinhas para a próxima
              data; concluir mais de uma aula no mesmo dia adianta a previsão.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Progress value={progressPercent} className="h-2" />
              <span className="shrink-0 text-sm text-muted-foreground">
                {schedule.completedCount}/{schedule.totalCount} ({progressPercent}%)
              </span>
            </div>

            <p className="text-sm">
              {schedule.pendingCount === 0 ? (
                <span className="text-foreground">
                  Você concluiu todas as aulas disponíveis no currículo até agora. 🎉
                </span>
              ) : schedule.forecastDate ? (
                <>
                  Previsão de conclusão das {schedule.pendingCount} aula(s) pendente(s):{" "}
                  <strong className="text-foreground">
                    {schedule.forecastDate.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </strong>
                  .
                </>
              ) : (
                <span className="text-destructive">
                  Nenhum dia da semana está marcado como disponível — selecione ao menos um dia
                  acima para o planejador conseguir agendar suas aulas.
                </span>
              )}
            </p>

            {nextUp.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Próximas aulas agendadas</p>
                <div className="divide-y rounded-lg border">
                  {nextUp.map((item) => (
                    <Link
                      key={item.lessonId}
                      href={`/learn/${item.lessonId}`}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-accent/50"
                    >
                      <span>
                        <span className="text-muted-foreground">
                          {formatDayNumber(item.curriculumIndex)}
                        </span>{" "}
                        — {stripWeekDayPrefix(item.title)}
                      </span>
                      <Badge variant="secondary">
                        {item.date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            <Link
              href="/calendar"
              className="flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
            >
              Ver cronograma completo no calendário <ArrowRight className="size-3.5" />
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="size-4" /> Metas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StudyGoals goals={goals} weekOptions={weekOptions} />
        </CardContent>
      </Card>
    </div>
  );
}
