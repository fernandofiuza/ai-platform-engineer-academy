import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, GraduationCap, Sparkles } from "lucide-react";

import { auth } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Markdown } from "@/components/markdown";
import { AskProfessorDialog } from "@/modules/artificial-intelligence/components/ask-professor-dialog";
import { LessonQuestionsList } from "@/modules/artificial-intelligence/components/lesson-questions-list";
import { getLessonQuestions } from "@/modules/artificial-intelligence/queries";
import { LessonCompleteForm } from "@/modules/curriculum/components/lesson-complete-form";
import { getLessonById, getLessonCompletion } from "@/modules/curriculum/queries";
import { LessonNotesPanel } from "@/modules/notes/components/lesson-notes-panel";
import { getNotesForLesson } from "@/modules/notes/queries";
import { getLessonSchedule } from "@/modules/planning/queries";
import { formatScheduleDate, stripWeekDayPrefix } from "@/modules/planning/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = await getLessonById(lessonId);
  return { title: lesson ? lesson.title : "Aula" };
}

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const [session, lesson] = await Promise.all([auth(), getLessonById(lessonId)]);

  if (!lesson) {
    notFound();
  }

  const [completion, questions, notes, schedule] = await Promise.all([
    session?.user ? getLessonCompletion(session.user.id, lessonId) : Promise.resolve(null),
    getLessonQuestions(lessonId),
    session?.user ? getNotesForLesson(session.user.id, lessonId) : Promise.resolve([]),
    session?.user ? getLessonSchedule(session.user.id) : Promise.resolve(null),
  ]);

  const scheduleEntry = schedule?.items.find((i) => i.lessonId === lessonId) ?? null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/learn" className="hover:underline">
            Aprender
          </Link>
          <span>·</span>
          <span>Semana {scheduleEntry?.paceWeekIndex ?? lesson.week.number}</span>
          {lesson.week.phase ? <span>· {lesson.week.phase.label}</span> : null}
          {scheduleEntry ? (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                {formatScheduleDate(scheduleEntry.date, "long")}
                {scheduleEntry.status === "scheduled" ? " (planejada)" : ""}
              </span>
            </>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {scheduleEntry ? stripWeekDayPrefix(lesson.title) : lesson.title}
          </h1>
          {lesson.isDemo ? <Badge variant="secondary">demonstrativa</Badge> : null}
          {completion ? <Badge>concluída</Badge> : null}
        </div>
        {lesson.objective ? (
          <p className="mt-2 text-sm text-muted-foreground">{lesson.objective}</p>
        ) : null}
        {lesson.durationMinutes ? (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3.5" /> {lesson.durationMinutes} min
          </p>
        ) : null}
      </div>

      {lesson.status === "DRAFT" ? (
        <Alert>
          <Sparkles className="size-4" />
          <AlertDescription>
            Este conteúdo foi gerado por IA e ainda está aguardando revisão da área
            administrativa — pode conter erros ou informações incompletas.
          </AlertDescription>
        </Alert>
      ) : null}

      {lesson.contentMarkdown ? (
        <Card>
          <CardContent className="pt-6">
            <Markdown content={lesson.contentMarkdown} />
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="size-4" /> Pergunte ao Professor
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Ficou com alguma dúvida sobre esta aula? Pergunte diretamente aqui, sem sair da
            página.
          </p>
          <AskProfessorDialog lessonId={lesson.id} />
        </CardContent>
      </Card>

      <LessonQuestionsList
        questions={questions.map((q) => ({
          id: q.id,
          question: q.question,
          answer: q.answer,
          userName: q.user.name.split(" ")[0],
          createdAt: q.createdAt,
        }))}
      />

      {session?.user ? (
        <LessonNotesPanel lessonId={lesson.id} lessonTitle={lesson.title} notes={notes} />
      ) : null}

      {lesson.resources.length > 0 ? (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">Recursos</h2>
          <ul className="mt-2 space-y-1">
            {lesson.resources.map((resource) => (
              <li key={resource.id}>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  {resource.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {completion ? "Sua reflexão" : "Concluir esta aula"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LessonCompleteForm
            lessonId={lesson.id}
            initialCompletion={
              completion
                ? {
                    confidence: completion.confidence,
                    whatLearned: completion.whatLearned,
                    whatUnclear: completion.whatUnclear,
                    completedAt: completion.completedAt,
                  }
                : null
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
