"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardXp, checkAndAwardBadges } from "@/modules/gamification/service";
import { completeLaboratorySchema, type CompleteLaboratoryInput } from "./schema";

export async function completeLaboratoryAction(input: CompleteLaboratoryInput) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const parsed = completeLaboratorySchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };

  const laboratory = await db.laboratory.findUnique({ where: { id: parsed.data.laboratoryId } });
  if (!laboratory) return { error: "Laboratório não encontrado." };

  const existing = await db.laboratoryCompletion.findUnique({
    where: {
      userId_laboratoryId: { userId: session.user.id, laboratoryId: parsed.data.laboratoryId },
    },
  });

  await db.laboratoryCompletion.upsert({
    where: {
      userId_laboratoryId: { userId: session.user.id, laboratoryId: parsed.data.laboratoryId },
    },
    update: { evidenceUrl: parsed.data.evidenceUrl || null, notes: parsed.data.notes },
    create: {
      userId: session.user.id,
      laboratoryId: parsed.data.laboratoryId,
      evidenceUrl: parsed.data.evidenceUrl || null,
      notes: parsed.data.notes,
    },
  });

  if (!existing) {
    await awardXp(session.user.id, "laboratory_completed", 15, {
      type: "Laboratory",
      id: parsed.data.laboratoryId,
    });
  }
  await checkAndAwardBadges(session.user.id);

  revalidatePath("/labs");
  revalidatePath(`/labs/${parsed.data.laboratoryId}`);
  return { error: null };
}
