"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { emptyChecklist } from "./checklist";
import { addPortfolioItemSchema, updateChecklistSchema, type AddPortfolioItemInput, type UpdateChecklistInput } from "./schema";

export async function addPortfolioItemAction(input: AddPortfolioItemInput) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const parsed = addPortfolioItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await db.portfolioItem.create({
    data: {
      userId: session.user.id,
      repoUrl: parsed.data.repoUrl,
      projectId: parsed.data.projectId || null,
      qualityChecklist: emptyChecklist(),
    },
  });

  revalidatePath("/portfolio");
  return { error: null };
}

async function assertOwnedItem(userId: string, itemId: string) {
  const item = await db.portfolioItem.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== userId) return null;
  return item;
}

export async function updateChecklistAction(input: UpdateChecklistInput) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const parsed = updateChecklistSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };

  const item = await assertOwnedItem(session.user.id, parsed.data.itemId);
  if (!item) return { error: "Item não encontrado." };

  await db.portfolioItem.update({
    where: { id: parsed.data.itemId },
    data: { qualityChecklist: parsed.data.checklist },
  });

  revalidatePath("/portfolio");
  return { error: null };
}

export async function deletePortfolioItemAction(itemId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const item = await assertOwnedItem(session.user.id, itemId);
  if (!item) return { error: "Item não encontrado." };

  await db.portfolioItem.delete({ where: { id: itemId } });
  revalidatePath("/portfolio");
  return { error: null };
}
