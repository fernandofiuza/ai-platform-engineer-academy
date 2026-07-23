"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createGoalSchema,
  rescheduleGoalSchema,
  studyPlanSchema,
  type CreateGoalInput,
  type RescheduleGoalInput,
  type StudyPlanInput,
} from "./schema";

export async function saveStudyPlanAction(input: StudyPlanInput) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const parsed = studyPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await db.studyPlan.upsert({
    where: { userId: session.user.id },
    update: parsed.data,
    create: { userId: session.user.id, ...parsed.data },
  });

  revalidatePath("/planner");
  return { error: null };
}

export async function createGoalAction(input: CreateGoalInput) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const parsed = createGoalSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await db.studyGoal.create({
    data: {
      userId: session.user.id,
      title: parsed.data.title,
      targetDate: parsed.data.targetDate,
      relatedWeekId: parsed.data.relatedWeekId || null,
    },
  });

  revalidatePath("/planner");
  return { error: null };
}

async function assertOwnedGoal(userId: string, goalId: string) {
  const goal = await db.studyGoal.findUnique({ where: { id: goalId } });
  if (!goal || goal.userId !== userId) return null;
  return goal;
}

export async function setGoalStatusAction(goalId: string, status: "OPEN" | "DONE" | "CANCELLED") {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const goal = await assertOwnedGoal(session.user.id, goalId);
  if (!goal) return { error: "Meta não encontrada." };

  await db.studyGoal.update({ where: { id: goalId }, data: { status } });
  revalidatePath("/planner");
  return { error: null };
}

export async function rescheduleGoalAction(input: RescheduleGoalInput) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const parsed = rescheduleGoalSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };

  const goal = await assertOwnedGoal(session.user.id, parsed.data.goalId);
  if (!goal) return { error: "Meta não encontrada." };

  await db.studyGoal.update({
    where: { id: parsed.data.goalId },
    data: { targetDate: parsed.data.targetDate },
  });
  revalidatePath("/planner");
  return { error: null };
}

export async function deleteGoalAction(goalId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const goal = await assertOwnedGoal(session.user.id, goalId);
  if (!goal) return { error: "Meta não encontrada." };

  await db.studyGoal.delete({ where: { id: goalId } });
  revalidatePath("/planner");
  return { error: null };
}
