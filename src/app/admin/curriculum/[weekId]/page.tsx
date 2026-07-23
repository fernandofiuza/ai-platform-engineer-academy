import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { LessonEditor } from "@/modules/admin-curriculum/components/lesson-editor";
import { WeekEditForm } from "@/modules/admin-curriculum/components/week-edit-form";
import { getWeekWithLessonsForAdmin } from "@/modules/admin-curriculum/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ weekId: string }>;
}): Promise<Metadata> {
  const { weekId } = await params;
  const week = await getWeekWithLessonsForAdmin(weekId);
  return { title: week ? week.title : "Semana" };
}

export default async function AdminWeekDetailPage({
  params,
}: {
  params: Promise<{ weekId: string }>;
}) {
  const { weekId } = await params;
  const week = await getWeekWithLessonsForAdmin(weekId);

  if (!week) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/admin/curriculum" className="flex items-center gap-1 text-sm text-muted-foreground hover:underline">
        <ArrowLeft className="size-4" /> Voltar ao currículo
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Semana {week.number} {week.phase ? `— ${week.phase.label}` : ""}
        </h1>
      </div>

      <WeekEditForm
        weekId={week.id}
        initialTitle={week.title}
        initialObjective={week.objective ?? ""}
        initialStatus={week.status}
      />

      <div>
        <h2 className="text-sm font-medium text-muted-foreground">
          Aulas ({week.lessons.length})
        </h2>
        <div className="mt-2 space-y-3">
          {week.lessons.map((lesson) => (
            <LessonEditor
              key={`${lesson.id}-${lesson.updatedAt.getTime()}`}
              weekId={week.id}
              lesson={lesson}
              nextOrder={0}
            />
          ))}
          <LessonEditor weekId={week.id} nextOrder={week.lessons.length} />
        </div>
      </div>
    </div>
  );
}
