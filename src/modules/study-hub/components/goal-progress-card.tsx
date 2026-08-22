import Link from "next/link";
import { Target } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type GoalProgress = {
  dailyTargetMinutes: number;
  dailyActualMinutes: number;
  weeklyTargetMinutes: number;
  weeklyActualMinutes: number;
} | null;

export function GoalProgressCard({ progress }: { progress: GoalProgress }) {
  if (!progress) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="size-4" /> Metas de estudo
          </CardTitle>
          <CardDescription>
            Configure sua carga diária no{" "}
            <Link href="/planner" className="underline">
              planejador
            </Link>{" "}
            pra acompanhar sua meta aqui.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const dailyPercent =
    progress.dailyTargetMinutes > 0
      ? Math.min(100, Math.round((progress.dailyActualMinutes / progress.dailyTargetMinutes) * 100))
      : 0;
  const weeklyPercent =
    progress.weeklyTargetMinutes > 0
      ? Math.min(100, Math.round((progress.weeklyActualMinutes / progress.weeklyTargetMinutes) * 100))
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="size-4" /> Metas de estudo
        </CardTitle>
        <CardDescription>
          Baseado na carga diária do{" "}
          <Link href="/planner" className="underline">
            planejador
          </Link>
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm">
            <span>Meta de hoje</span>
            <span className="text-muted-foreground">
              {progress.dailyActualMinutes} / {progress.dailyTargetMinutes} min
            </span>
          </div>
          <Progress value={dailyPercent} className="mt-1.5 h-2" />
        </div>
        <div>
          <div className="flex items-center justify-between text-sm">
            <span>Meta da semana</span>
            <span className="text-muted-foreground">
              {progress.weeklyActualMinutes} / {progress.weeklyTargetMinutes} min
            </span>
          </div>
          <Progress value={weeklyPercent} className="mt-1.5 h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
