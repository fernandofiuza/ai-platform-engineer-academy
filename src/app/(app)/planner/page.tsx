import type { Metadata } from "next";
import { CalendarClock, Target, TrendingUp } from "lucide-react";

import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StudyGoals } from "@/modules/planning/components/study-goals";
import { StudyPlanForm } from "@/modules/planning/components/study-plan-form";
import { getGoals, getStudyPlan, getWeekOptions } from "@/modules/planning/queries";
import { getProgramWithPhasesAndWeeks } from "@/modules/curriculum/queries";

export const metadata: Metadata = { title: "Planejador de estudos" };

export default async function PlannerPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [plan, goals, weekOptions, program] = await Promise.all([
    getStudyPlan(userId),
    getGoals(userId),
    getWeekOptions(),
    getProgramWithPhasesAndWeeks(),
  ]);

  let estimate: { weeksToFinish: number; finishDate: Date } | null = null;
  if (plan && program && plan.availableDays.length > 0) {
    const weeksToFinish = Math.ceil(
      (program.totalWeeks * program.weeklyDays) / plan.availableDays.length
    );
    const finishDate = new Date(plan.startDate);
    finishDate.setDate(finishDate.getDate() + weeksToFinish * 7);
    estimate = { weeksToFinish, finishDate };
  }

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
            Usada para estimar seu ritmo em relação à carga prevista da formação
            {program ? ` (${program.weeklyDays} dias/semana, ${program.dailyHours}h/dia)` : ""}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudyPlanForm initialPlan={plan} />
        </CardContent>
      </Card>

      {estimate ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4" /> Estimativa (planejamento automático básico)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No seu ritmo atual, a formação levaria aproximadamente{" "}
            <strong className="text-foreground">{estimate.weeksToFinish} semanas</strong>, terminando
            por volta de{" "}
            <strong className="text-foreground">
              {estimate.finishDate.toLocaleDateString("pt-BR")}
            </strong>
            . Estimativa simples baseada na sua disponibilidade vs. a carga prevista — não
            considera férias/pausas registradas nas observações.
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
