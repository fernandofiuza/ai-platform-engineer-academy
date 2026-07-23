import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";

import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getLessonsForLearnPage } from "@/modules/curriculum/queries";

export const metadata: Metadata = { title: "Aprender" };

export default async function LearnPage() {
  const [session, lessons] = await Promise.all([auth(), getLessonsForLearnPage()]);

  const completions = session?.user
    ? await db.lessonCompletion.findMany({
        where: { userId: session.user.id, lessonId: { in: lessons.map((l) => l.id) } },
      })
    : [];
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Aprender</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aulas das 104 semanas da formação, geradas a partir da grade curricular. Explicações
          mais aprofundadas de cada tópico são adicionadas progressivamente pela área
          administrativa.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {lessons.map((lesson) => (
          <Link key={lesson.id} href={`/learn/${lesson.id}`}>
            <Card className="h-full transition-colors hover:bg-accent/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <BookOpen className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <CardTitle className="text-base">{lesson.title}</CardTitle>
                    <CardDescription>
                      Semana {lesson.week.number}
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
                  {completedIds.has(lesson.id) ? (
                    <Badge>concluída</Badge>
                  ) : (
                    <ArrowRight className="size-4" />
                  )}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
