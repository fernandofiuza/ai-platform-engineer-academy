"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { awardXp, checkAndAwardBadges } from "@/modules/gamification/service";
import {
  completeLaboratorySchema,
  saveLaboratorySchema,
  type CompleteLaboratoryInput,
  type SaveLaboratoryInput,
} from "./schema";

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

export async function saveLaboratoryAction(input: SaveLaboratoryInput) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "Apenas administradores podem gerenciar laboratórios." };
  }

  const parsed = saveLaboratorySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { laboratoryId, ...data } = parsed.data;

  if (laboratoryId) {
    await db.laboratory.update({ where: { id: laboratoryId }, data });
  } else {
    await db.laboratory.create({ data });
  }

  logger.info("admin_action", {
    adminId: session.user.id,
    action: laboratoryId ? "update_laboratory" : "create_laboratory",
  });
  revalidatePath("/admin/labs");
  revalidatePath("/labs");
  return { error: null };
}

export async function archiveLaboratoryAction(laboratoryId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "Apenas administradores podem gerenciar laboratórios." };
  }

  await db.laboratory.update({ where: { id: laboratoryId }, data: { status: "ARCHIVED" } });

  logger.info("admin_action", { adminId: session.user.id, action: "archive_laboratory", laboratoryId });
  revalidatePath("/admin/labs");
  revalidatePath("/labs");
  return { error: null };
}
