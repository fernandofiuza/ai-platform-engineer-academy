import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { auth } from "@/lib/auth";
import { ExternalLessonCompleteToggle } from "@/modules/study-hub/components/external-lesson-complete-toggle";
import { ExternalLessonNotesPanel } from "@/modules/study-hub/components/external-lesson-notes-panel";
import { ExternalLessonReviewToggle } from "@/modules/study-hub/components/external-lesson-review-toggle";
import { LessonViewRecorder } from "@/modules/study-hub/components/lesson-view-recorder";
import { getExternalLessonDetail } from "@/modules/study-hub/queries";
import { getNotesForExternalLesson } from "@/modules/notes/queries";
import { SessionTimer } from "@/modules/study-sessions/components/session-timer";
import { getActiveSession } from "@/modules/study-sessions/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}): Promise<Metadata> {
  const { lessonId } = await params;
  const session = await auth();
  if (!session?.user) return { title: "Aula" };
  const detail = await getExternalLessonDetail(session.user.id, lessonId);
  return { title: detail ? detail.lesson.title : "Aula" };
}

export default async function ExternalLessonDetailPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const detail = await getExternalLessonDetail(userId, lessonId);
  if (!detail) {
    notFound();
  }

  const { lesson, module: courseModule, course, prev, next } = detail;
  const [notes, activeSession] = await Promise.all([
    getNotesForExternalLesson(userId, lessonId),
    getActiveSession(userId),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <LessonViewRecorder lessonId={lessonId} />

      <div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/study-hub/courses" className="hover:underline">
            Meus cursos
          </Link>
          <span>·</span>
          <Link href={`/study-hub/courses/${courseId}`} className="hover:underline">
            {course.title}
          </Link>
          <span>·</span>
          <span>{courseModule.title}</span>
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{lesson.title}</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ExternalLessonCompleteToggle lessonId={lesson.id} completed={lesson.completed} />
        <ExternalLessonReviewToggle lessonId={lesson.id} initialMarked={lesson.markedForReview} />
      </div>

      <SessionTimer initialSession={activeSession} contextExternalLessonId={lesson.id} />

      <ExternalLessonNotesPanel externalLessonId={lesson.id} notes={notes} />

      <div className="flex items-center justify-between border-t pt-4 text-sm">
        {prev ? (
          <Link
            href={`/study-hub/courses/${courseId}/lessons/${prev.id}`}
            className="text-muted-foreground hover:text-foreground hover:underline"
          >
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/study-hub/courses/${courseId}/lessons/${next.id}`}
            className="inline-flex items-center gap-1 font-medium hover:underline"
          >
            Próxima aula: {next.title} <ArrowRight className="size-3.5" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
