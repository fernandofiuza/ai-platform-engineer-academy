"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { awardXp, checkAndAwardBadges } from "@/modules/gamification/service";
import {
  saveProjectSchema,
  saveSubmissionSchema,
  type SaveProjectInput,
  type SaveSubmissionInput,
} from "./schema";

export async function saveSubmissionAction(input: SaveSubmissionInput) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const parsed = saveSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const project = await db.project.findUnique({ where: { id: parsed.data.projectId } });
  if (!project) return { error: "Projeto não encontrado." };

  const existing = await db.projectSubmission.findUnique({
    where: { userId_projectId: { userId: session.user.id, projectId: parsed.data.projectId } },
  });

  await db.projectSubmission.upsert({
    where: { userId_projectId: { userId: session.user.id, projectId: parsed.data.projectId } },
    update: {
      repoUrl: parsed.data.repoUrl || null,
      deployUrl: parsed.data.deployUrl || null,
      decisions: parsed.data.decisions,
      retrospective: parsed.data.retrospective,
      status: parsed.data.status,
    },
    create: {
      userId: session.user.id,
      projectId: parsed.data.projectId,
      repoUrl: parsed.data.repoUrl || null,
      deployUrl: parsed.data.deployUrl || null,
      decisions: parsed.data.decisions,
      retrospective: parsed.data.retrospective,
      status: parsed.data.status,
    },
  });

  if (!existing) {
    await awardXp(session.user.id, "project_submitted", 20, {
      type: "Project",
      id: parsed.data.projectId,
    });
  }
  await checkAndAwardBadges(session.user.id);

  revalidatePath("/projects");
  revalidatePath(`/projects/${parsed.data.projectId}`);
  revalidatePath("/portfolio");
  return { error: null };
}

export async function saveProjectAction(input: SaveProjectInput) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "Apenas administradores podem gerenciar projetos." };
  }

  const parsed = saveProjectSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { projectId, ...data } = parsed.data;

  if (projectId) {
    await db.project.update({ where: { id: projectId }, data });
  } else {
    await db.project.create({ data });
  }

  logger.info("admin_action", { adminId: session.user.id, action: projectId ? "update_project" : "create_project" });
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  return { error: null };
}

export async function archiveProjectAction(projectId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "Apenas administradores podem gerenciar projetos." };
  }

  await db.project.update({ where: { id: projectId }, data: { status: "ARCHIVED" } });

  logger.info("admin_action", { adminId: session.user.id, action: "archive_project", projectId });
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  return { error: null };
}
