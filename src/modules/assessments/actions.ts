"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardXp, checkAndAwardBadges } from "@/modules/gamification/service";
import { submitAttemptSchema, type SubmitAttemptInput } from "./schema";

export async function submitAttemptAction(input: SubmitAttemptInput) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Sessão expirada.", score: null };
  }

  const parsed = submitAttemptSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos.", score: null };
  }

  const assessment = await db.assessment.findUnique({
    where: { id: parsed.data.assessmentId },
    include: { questions: { include: { options: true } } },
  });
  if (!assessment) {
    return { error: "Avaliação não encontrada.", score: null };
  }

  const gradableQuestions = assessment.questions.filter((q) => q.type !== "SHORT_ANSWER");
  let correct = 0;
  for (const question of gradableQuestions) {
    const selectedOptionId = parsed.data.answers[question.id];
    const selectedOption = question.options.find((o) => o.id === selectedOptionId);
    if (selectedOption?.isCorrect) correct++;
  }
  const score = gradableQuestions.length > 0 ? (correct / gradableQuestions.length) * 100 : 0;

  await db.assessmentAttempt.create({
    data: {
      userId: session.user.id,
      assessmentId: parsed.data.assessmentId,
      submittedAt: new Date(),
      score,
      answers: parsed.data.answers,
      timeSpentSeconds: parsed.data.timeSpentSeconds,
    },
  });

  await awardXp(session.user.id, "quiz_submitted", 10, {
    type: "Assessment",
    id: parsed.data.assessmentId,
  });
  await checkAndAwardBadges(session.user.id);

  revalidatePath("/assessments");
  revalidatePath(`/assessments/${parsed.data.assessmentId}`);
  return { error: null, score };
}
