"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { awardXp } from "@/modules/gamification/service";
import { getCertificationEligibility } from "./queries";

/**
 * Emite o certificado interno do semestre (Etapa 8) se o estudante cumprir os 3 requisitos:
 * semanas obrigatórias concluídas, projeto final do semestre com submissão DONE, e avaliação
 * final do semestre com ao menos uma tentativa enviada. Idempotente — reemitir para um semestre
 * já certificado apenas retorna o certificado existente, nunca duplica.
 */
export async function requestCertificationAction(phaseId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Faça login novamente.", certificationId: null };

  const existing = await db.certification.findUnique({
    where: { userId_phaseId: { userId: session.user.id, phaseId } },
  });
  if (existing) return { error: null, certificationId: existing.id };

  const eligibility = await getCertificationEligibility(session.user.id, phaseId);
  if (!eligibility) return { error: "Semestre não encontrado.", certificationId: null };
  if (!eligibility.eligible) {
    return {
      error: "Você ainda não cumpriu todos os requisitos deste semestre.",
      certificationId: null,
    };
  }

  const code = `APEA-S${eligibility.phase.order}-${randomUUID().split("-")[0].toUpperCase()}`;
  const certification = await db.certification.create({
    data: { userId: session.user.id, phaseId, code },
  });

  await awardXp(session.user.id, "certification_earned", 50, { type: "Phase", id: phaseId });

  revalidatePath("/certifications");
  return { error: null, certificationId: certification.id };
}

const setPhaseRequirementsSchema = z.object({
  phaseId: z.string().min(1),
  finalProjectId: z.string().nullable(),
  finalAssessmentId: z.string().nullable(),
});

/** Admin define qual Project/Assessment conta como "final do semestre" para a certificação. */
export async function setPhaseCertificationRequirementsAction(
  input: z.infer<typeof setPhaseRequirementsSchema>
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "Apenas administradores podem definir os requisitos de certificação." };
  }

  const parsed = setPhaseRequirementsSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };

  await db.phase.update({
    where: { id: parsed.data.phaseId },
    data: {
      finalProjectId: parsed.data.finalProjectId,
      finalAssessmentId: parsed.data.finalAssessmentId,
    },
  });

  logger.info("admin_action", {
    adminId: session.user.id,
    action: "set_phase_certification_requirements",
    phaseId: parsed.data.phaseId,
  });
  revalidatePath("/admin/curriculum");
  revalidatePath("/certifications");
  return { error: null };
}
