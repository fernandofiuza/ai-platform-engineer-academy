import type { Metadata } from "next";
import Link from "next/link";
import { Upload } from "lucide-react";

import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalCourseCard } from "@/modules/study-hub/components/external-course-card";
import { ExternalCourseFormDialog } from "@/modules/study-hub/components/external-course-form-dialog";
import { getExternalCourses } from "@/modules/study-hub/queries";

export const metadata: Metadata = { title: "Meus cursos · Study Hub" };

export default async function StudyHubCoursesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const courses = await getExternalCourses(userId);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Meus cursos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cursos externos que você está estudando por fora do APEX.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/study-hub/import">
              <Upload className="size-4" /> Importar
            </Link>
          </Button>
          <ExternalCourseFormDialog />
        </div>
      </div>

      {courses.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Nenhum curso externo ainda</CardTitle>
            <CardDescription>
              Crie um curso manualmente ou importe a estrutura de um curso pronto (texto ou JSON).
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <ExternalCourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
