"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function toggleMilestoneAchievedAction(milestoneId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "Apenas administradores podem atualizar a linha do tempo." };
  }

  const milestone = await db.architectureMilestone.findUnique({ where: { id: milestoneId } });
  if (!milestone) return { error: "Marco não encontrado." };

  const isAchieved = milestone.status === "COMPLETED";
  await db.architectureMilestone.update({
    where: { id: milestoneId },
    data: {
      status: isAchieved ? "PLANNED" : "COMPLETED",
      achievedAt: isAchieved ? null : new Date(),
    },
  });

  revalidatePath("/ai-labs");
  return { error: null };
}
