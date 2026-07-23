import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardCheck } from "lucide-react";

import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getAssessments } from "@/modules/assessments/queries";

export const metadata: Metadata = { title: "Avaliações" };

export default async function AssessmentsPage() {
  const [session, assessments] = await Promise.all([auth(), getAssessments()]);

  const attempts = session?.user
    ? await db.assessmentAttempt.findMany({
        where: { userId: session.user.id, assessmentId: { in: assessments.map((a) => a.id) } },
        orderBy: { startedAt: "desc" },
      })
    : [];
  const bestScoreByAssessment = new Map<string, number>();
  for (const attempt of attempts) {
    if (attempt.score === null) continue;
    const current = bestScoreByAssessment.get(attempt.assessmentId) ?? -1;
    if (attempt.score > current) bestScoreByAssessment.set(attempt.assessmentId, attempt.score);
  }

  if (assessments.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Nenhuma avaliação disponível ainda</CardTitle>
          <CardDescription>
            Quizzes e checkpoints chegam conforme o currículo for definido.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Avaliações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Quizzes de revisão do conteúdo já disponível.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {assessments.map((assessment) => {
          const bestScore = bestScoreByAssessment.get(assessment.id);
          return (
            <Link key={assessment.id} href={`/assessments/${assessment.id}`}>
              <Card className="h-full transition-colors hover:bg-accent/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <ClipboardCheck className="size-5" />
                    </span>
                    <div>
                      <CardTitle className="text-base">{assessment.title}</CardTitle>
                      <CardDescription>{assessment.questions.length} perguntas</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  {bestScore !== undefined ? (
                    <Badge>Melhor resultado: {Math.round(bestScore)}%</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Ainda não respondida</span>
                  )}
                  <ArrowRight className="size-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
