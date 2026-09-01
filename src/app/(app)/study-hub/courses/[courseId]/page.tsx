import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbLabel } from "@/components/layout/breadcrumb-labels";
import { ExternalCourseDeleteButton } from "@/modules/study-hub/components/external-course-delete-button";
import { ExternalCourseFormDialog } from "@/modules/study-hub/components/external-course-form-dialog";
import { ExternalLessonChecklist } from "@/modules/study-hub/components/external-lesson-checklist";
import { getExternalCourseDetail } from "@/modules/study-hub/queries";
import {
  EXTERNAL_COURSE_STATUS_BADGE_VARIANT,
  EXTERNAL_COURSE_STATUS_LABELS,
} from "@/modules/study-hub/labels";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string }>;
}): Promise<Metadata> {
  const { courseId } = await params;
  const session = await auth();
  if (!session?.user) return { title: "Curso" };
  const detail = await getExternalCourseDetail(session.user.id, courseId);
  return { title: detail ? detail.course.title : "Curso" };
}

export default async function ExternalCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const detail = await getExternalCourseDetail(userId, courseId);
  if (!detail) {
    notFound();
  }

  const { course, totalLessons, completedLessons, progressPercent } = detail;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BreadcrumbLabel segment={course.id} label={course.title} />
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/study-hub/courses" className="hover:underline">
            Meus cursos
          </Link>
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{course.title}</h1>
            {course.platform ? (
              <p className="mt-1 text-sm text-muted-foreground">{course.platform}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={EXTERNAL_COURSE_STATUS_BADGE_VARIANT[course.status]}>
              {EXTERNAL_COURSE_STATUS_LABELS[course.status]}
            </Badge>
            <ExternalCourseFormDialog
              existingCourse={course}
              trigger={
                <button className="text-sm text-muted-foreground hover:text-foreground hover:underline">
                  Editar
                </button>
              }
            />
            <ExternalCourseDeleteButton courseId={course.id} courseTitle={course.title} />
          </div>
        </div>
        {course.description ? (
          <p className="mt-3 text-sm text-muted-foreground">{course.description}</p>
        ) : null}
      </div>

      <ExternalLessonChecklist
        courseId={course.id}
        modules={course.modules}
        totalLessons={totalLessons}
        completedLessons={completedLessons}
        progressPercent={progressPercent}
      />
    </div>
  );
}
