import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarCheck, ListChecks, Sparkles, Timer } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTotalStudyMinutes } from "@/modules/study-sessions/queries";

export const metadata: Metadata = { title: "Dashboard" };

const NEXT_STEPS = [
  {
    title: "Projetos e laboratórios práticos",
    description: "Projetos conectados ao currículo, com critérios de aceite e evidências.",
    phase: "Fase 4",
  },
  {
    title: "Mapa de competências e portfólio",
    description: "Evolução das suas competências técnicas e checklist de qualidade do GitHub.",
    phase: "Fase 4",
  },
  {
    title: "Tutor de IA (nível 1)",
    description: "Explicações, resumos e sugestões de próxima atividade — funciona sem chave de IA.",
    phase: "Fase 5",
  },
];

function computeStreak(sessionDates: Date[]) {
  const uniqueDays = new Set(
    sessionDates.map((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime())
  );
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  // Se não estudou hoje, a sequência ainda conta a partir de ontem.
  if (!uniqueDays.has(cursor.getTime())) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (uniqueDays.has(cursor.getTime())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user;

  const [dbUser, totalLessons, completedLessons, totalMinutes, sessionsForStreak, openGoals] =
    await Promise.all([
      db.user.findUnique({ where: { id: user.id }, select: { name: true, createdAt: true } }),
      db.lesson.count({ where: { status: "AVAILABLE" } }),
      db.lessonCompletion.count({ where: { userId: user.id } }),
      getTotalStudyMinutes(user.id),
      db.studySession.findMany({
        where: { userId: user.id, endedAt: { not: null } },
        select: { startedAt: true },
      }),
      db.studyGoal.count({ where: { userId: user.id, status: "OPEN" } }),
    ]);

  const firstName = (dbUser?.name ?? user.name ?? "").split(" ")[0];
  const streak = computeStreak(sessionsForStreak.map((s) => s.startedAt));
  const progressPercent =
    totalLessons > 0 ? Math.round((Math.min(completedLessons, totalLessons) / totalLessons) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Olá, {firstName} 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bem-vindo(a) à AI Platform Engineer Academy. Sua conta foi criada em{" "}
          {dbUser?.createdAt.toLocaleDateString("pt-BR")}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ListChecks className="size-4" /> Aulas concluídas
            </CardDescription>
            <CardTitle className="text-3xl">{progressPercent}%</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {completedLessons} de {totalLessons} aulas disponíveis concluídas.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Timer className="size-4" /> Horas estudadas
            </CardDescription>
            <CardTitle className="text-3xl">{(totalMinutes / 60).toFixed(1)}h</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {totalMinutes} minutos registrados em{" "}
            <Link href="/sessions" className="underline">
              sessões de estudo
            </Link>
            .
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CalendarCheck className="size-4" /> Sequência de estudo
            </CardDescription>
            <CardTitle className="text-3xl">{streak} {streak === 1 ? "dia" : "dias"}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {openGoals > 0 ? (
              <Link href="/planner" className="underline">
                {openGoals} meta(s) em aberto
              </Link>
            ) : (
              "Nenhuma meta em aberto — crie uma no planejador."
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" /> Próximas entregas
          </CardTitle>
          <CardDescription>
            Fases 1 (Fundação), 2 (Currículo) e 3 (Aprendizagem — sessões, metas, planejador,
            calendário, anotações, avaliações e flashcards) já estão no ar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {NEXT_STEPS.map((step) => (
              <li key={step.title} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {step.phase}
                </Badge>
              </li>
            ))}
          </ul>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/roadmap">
              Ver roadmap <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
