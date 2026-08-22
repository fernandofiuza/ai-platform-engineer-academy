import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoalProgressCard } from "@/modules/study-hub/components/goal-progress-card";
import { MiniBarChart } from "@/modules/study-hub/components/mini-bar-chart";
import { MiniLineChart } from "@/modules/study-hub/components/mini-line-chart";
import { getGoalProgress } from "@/modules/study-hub/queries";
import { getStudyHubStatistics } from "@/modules/study-hub/statistics";

export const metadata: Metadata = { title: "Estatísticas · Study Hub" };

export default async function StudyHubStatisticsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [goalProgress, stats] = await Promise.all([
    getGoalProgress(userId),
    getStudyHubStatistics(userId),
  ]);

  const tiles = [
    { label: "Horas estudadas", value: `${stats.tiles.totalHours}h` },
    { label: "Aulas concluídas", value: stats.tiles.totalLessonsCompleted },
    { label: "Cursos externos concluídos", value: stats.tiles.externalCoursesCompleted },
    { label: "Média diária", value: `${stats.tiles.avgDailyMinutes} min` },
    { label: "Média semanal", value: `${Math.round((stats.tiles.avgWeeklyMinutes / 60) * 10) / 10}h` },
    { label: "Progresso médio dos cursos", value: `${stats.tiles.avgCourseProgress}%` },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Estatísticas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sua evolução de estudo, nativa e de cursos externos, combinada.
        </p>
      </div>

      <GoalProgressCard progress={goalProgress} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <CardHeader className="pb-2">
              <CardDescription>{tile.label}</CardDescription>
              <CardTitle className="text-2xl">{tile.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Horas estudadas por dia</CardTitle>
            <CardDescription>Últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={stats.hoursPerDay} valueSuffix="h" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Horas estudadas por semana</CardTitle>
            <CardDescription>Últimas 12 semanas</CardDescription>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={stats.hoursPerWeek} valueSuffix="h" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aulas concluídas por dia</CardTitle>
            <CardDescription>Últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={stats.lessonsPerDay} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução do progresso</CardTitle>
            <CardDescription>Total acumulado de aulas concluídas — últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <MiniLineChart data={stats.progressEvolution} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
