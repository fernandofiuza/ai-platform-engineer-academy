"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardXp, checkAndAwardBadges } from "@/modules/gamification/service";
import { finishSessionSchema, startSessionSchema, type FinishSessionInput, type StartSessionInput } from "./schema";

export async function startSessionAction(input: StartSessionInput) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Sessão expirada. Faça login novamente.", studySession: null };
  }

  const parsed = startSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos.", studySession: null };
  }

  const existing = await db.studySession.findFirst({
    where: { userId: session.user.id, endedAt: null },
  });
  if (existing) {
    return { error: null, studySession: existing };
  }

  const studySession = await db.studySession.create({
    data: { userId: session.user.id, lessonId: parsed.data.lessonId },
  });

  revalidatePath("/sessions");
  return { error: null, studySession };
}

async function assertOwnedActiveSession(userId: string, sessionId: string) {
  const studySession = await db.studySession.findUnique({ where: { id: sessionId } });
  if (!studySession || studySession.userId !== userId || studySession.endedAt) {
    return null;
  }
  return studySession;
}

export async function pauseSessionAction(sessionId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const studySession = await assertOwnedActiveSession(session.user.id, sessionId);
  if (!studySession) return { error: "Sessão de estudo não encontrada." };
  if (studySession.pausedAt) return { error: null };

  await db.studySession.update({
    where: { id: sessionId },
    data: { pausedAt: new Date() },
  });

  revalidatePath("/sessions");
  return { error: null };
}

export async function resumeSessionAction(sessionId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const studySession = await assertOwnedActiveSession(session.user.id, sessionId);
  if (!studySession) return { error: "Sessão de estudo não encontrada." };
  if (!studySession.pausedAt) return { error: null };

  const additionalPausedSeconds = Math.round(
    (Date.now() - studySession.pausedAt.getTime()) / 1000
  );

  await db.studySession.update({
    where: { id: sessionId },
    data: {
      pausedAt: null,
      totalPausedSeconds: studySession.totalPausedSeconds + additionalPausedSeconds,
    },
  });

  revalidatePath("/sessions");
  return { error: null };
}

export async function finishSessionAction(input: FinishSessionInput) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const parsed = finishSessionSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };

  const studySession = await assertOwnedActiveSession(session.user.id, parsed.data.sessionId);
  if (!studySession) return { error: "Sessão de estudo não encontrada." };

  const now = new Date();
  let totalPausedSeconds = studySession.totalPausedSeconds;
  if (studySession.pausedAt) {
    totalPausedSeconds += Math.round((now.getTime() - studySession.pausedAt.getTime()) / 1000);
  }
  const elapsedSeconds = Math.max(
    0,
    Math.round((now.getTime() - studySession.startedAt.getTime()) / 1000) - totalPausedSeconds
  );
  const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

  await db.studySession.update({
    where: { id: parsed.data.sessionId },
    data: {
      pausedAt: null,
      totalPausedSeconds,
      endedAt: now,
      durationMinutes,
      focusRating: parsed.data.focusRating,
      difficultyRating: parsed.data.difficultyRating,
      notes: parsed.data.notes,
      completedContent: parsed.data.completedContent ?? false,
    },
  });

  await awardXp(session.user.id, "session_finished", 5, {
    type: "StudySession",
    id: parsed.data.sessionId,
  });
  await checkAndAwardBadges(session.user.id);

  revalidatePath("/sessions");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function discardSessionAction(sessionId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const studySession = await assertOwnedActiveSession(session.user.id, sessionId);
  if (!studySession) return { error: "Sessão de estudo não encontrada." };

  await db.studySession.delete({ where: { id: sessionId } });

  revalidatePath("/sessions");
  return { error: null };
}
