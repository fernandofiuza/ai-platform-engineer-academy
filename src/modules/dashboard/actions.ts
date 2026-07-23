"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const updateManualCommitCountSchema = z.object({ count: z.number().int().min(0).max(1_000_000) });

/** "Commits registrados" (Etapa 5) é um campo manual — a integração real com GitHub é opcional
 * e não é exigida para o dashboard funcionar (ver `GitHubProvider`, Fase 4). */
export async function updateManualCommitCountAction(count: number) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Faça login novamente." };

  const parsed = updateManualCommitCountSchema.safeParse({ count });
  if (!parsed.success) return { error: "Número inválido." };

  await db.profile.update({
    where: { userId: session.user.id },
    data: { manualCommitCount: parsed.data.count },
  });

  revalidatePath("/dashboard");
  return { error: null };
}
