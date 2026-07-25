"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { emptyChecklist } from "./checklist";
import { getGitHubProvider } from "./github-provider";
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

/**
 * Sincroniza os sinais que a API pública do GitHub consegue confirmar objetivamente (README,
 * licença, workflow de CI, release, descrição) para o checklist — os outros 9 itens (instalação,
 * arquitetura, testes, etc.) continuam manuais, porque exigem julgamento de conteúdo que a API
 * não responde com um simples "existe/não existe". O aluno pode reeditar qualquer item depois;
 * sincronizar de novo apenas sobrescreve os 5 itens verificáveis com o estado atual do repositório.
 */
export async function syncPortfolioItemGitHubAction(itemId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const item = await assertOwnedItem(session.user.id, itemId);
  if (!item) return { error: "Item não encontrado." };

  try {
    const repo = await getGitHubProvider().getRepository(item.repoUrl);

    const checklist = {
      ...((item.qualityChecklist as Record<string, boolean>) ?? {}),
      readme: repo.hasReadme,
      license: repo.hasLicense,
      ci: repo.hasCiWorkflow,
      releases: repo.latestReleaseTag !== null,
      description: repo.description !== null && repo.description.trim().length > 0,
    };

    await db.portfolioItem.update({
      where: { id: itemId },
      data: {
        qualityChecklist: checklist,
        githubSyncedAt: new Date(),
        githubDescription: repo.description,
        githubOpenIssues: repo.openIssues,
        githubLatestRelease: repo.latestReleaseTag,
      },
    });

    revalidatePath("/portfolio");
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Falha ao sincronizar com o GitHub." };
  }
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
