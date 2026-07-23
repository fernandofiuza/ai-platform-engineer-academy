import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { QuizRunner } from "@/modules/assessments/components/quiz-runner";
import { getAssessmentById, getAttemptsForUser } from "@/modules/assessments/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}): Promise<Metadata> {
  const { assessmentId } = await params;
  const assessment = await getAssessmentById(assessmentId);
  return { title: assessment ? assessment.title : "Avaliação" };
}

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  const [session, assessment] = await Promise.all([auth(), getAssessmentById(assessmentId)]);

  if (!assessment) {
    notFound();
  }

  const attempts = session?.user ? await getAttemptsForUser(session.user.id, assessmentId) : [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{assessment.title}</h1>
        {assessment.lesson ? (
          <p className="mt-1 text-sm text-muted-foreground">Relacionado a: {assessment.lesson.title}</p>
        ) : null}
        {attempts.length > 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Você já tentou {attempts.length}x. Última tentativa:{" "}
            <Badge variant="secondary">{Math.round(attempts[0].score ?? 0)}%</Badge>
          </p>
        ) : null}
      </div>

      <QuizRunner assessmentId={assessment.id} questions={assessment.questions} />
    </div>
  );
}
