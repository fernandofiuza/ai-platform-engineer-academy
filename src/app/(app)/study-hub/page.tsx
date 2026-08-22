import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, History, RefreshCw, Upload } from "lucide-react";

import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ContinueStudyingCard } from "@/modules/study-hub/components/continue-studying-card";
import { ExternalCourseCard } from "@/modules/study-hub/components/external-course-card";
import { StudyHubSearch } from "@/modules/study-hub/components/study-hub-search";
import {
  getContinueStudying,
  getExternalCourses,
  getNativeCurriculumProgress,
  getReviewItems,
} from "@/modules/study-hub/queries";

export const metadata: Metadata = { title: "Study Hub" };

export default async function StudyHubPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [continueStudying, courses, nativeProgress, reviewItems] = await Promise.all([
    getContinueStudying(userId),
    getExternalCourses(userId),
    getNativeCurriculumProgress(userId),
    getReviewItems(userId),
  ]);

  const topReviewItems = reviewItems.slice(0, 3);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Study Hub</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sua jornada de estudos — conteúdo do APEX e cursos externos, num só lugar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/study-hub/historico">
              <History className="size-4" /> Histórico
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/study-hub/estatisticas">
              <BarChart3 className="size-4" /> Estatísticas
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/study-hub/import">
              <Upload className="size-4" /> Importar
            </Link>
          </Button>
          <Button asChild>
            <Link href="/study-hub/courses">Meus cursos</Link>
          </Button>
        </div>
      </div>

      <StudyHubSearch />

      <ContinueStudyingCard item={continueStudying} />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Cursos</h2>
          <Link href="/study-hub/courses" className="text-sm text-muted-foreground hover:underline">
            Ver todos
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/roadmap">
            <Card className="h-full transition-colors hover:border-primary/40">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">Formação Apex</CardTitle>
                  <Badge>APEX</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Currículo oficial do APEX</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-3">
                  <Progress value={nativeProgress.progressPercent} className="h-2" />
                  <span className="shrink-0 text-sm font-medium">
                    {nativeProgress.progressPercent}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {nativeProgress.completedLessons} / {nativeProgress.totalLessons} aulas
                  </span>
                  <span className="inline-flex items-center gap-1 text-foreground">
                    Ver roadmap <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
          {courses.slice(0, 5).map((course) => (
            <ExternalCourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Para revisar</h2>
          <Link href="/study-hub/review" className="text-sm text-muted-foreground hover:underline">
            Ver todas
          </Link>
        </div>
        {topReviewItems.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardDescription>Nada marcado para revisão ainda.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="divide-y rounded-lg border">
            {topReviewItems.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
              >
                <RefreshCw className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.contextLabel}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
