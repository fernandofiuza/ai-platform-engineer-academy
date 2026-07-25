"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getProviderForPersona } from "@/modules/artificial-intelligence/gateway";
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

function extractReviewScore(feedback: string): number | null {
  const match = feedback.match(/nota:?\s*(\d{1,2}(?:[.,]\d)?)/i);
  if (!match) return null;
  const score = Number(match[1].replace(",", "."));
  if (Number.isNaN(score)) return null;
  return Math.min(10, Math.max(0, score));
}

/**
 * Solicita uma revisão de código assistida por IA (persona Tech Lead, Etapa 2/6) para a
 * submissão do estudante. A revisão continua baseada nas informações que o estudante já forneceu
 * (URL do repositório, decisões técnicas, retrospectiva) e nos requisitos do projeto — não em uma
 * leitura linha a linha do código; a integração com `GitHubProvider` (usada pelo Portfólio para
 * sincronizar README/licença/CI/release) não alimenta esta revisão. Cada solicitação cria uma
 * nova linha em `CodeReview` (histórico completo, nunca sobrescrito).
 */
export async function requestCodeReviewAction(projectId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Faça login novamente." };

  const rateLimit = checkRateLimit(`code-review:${session.user.id}`, {
    windowMs: 10 * 60 * 1000,
    maxRequests: 5,
  });
  if (!rateLimit.allowed) {
    return { error: `Muitas solicitações de revisão. Tente novamente em ${rateLimit.retryAfterSeconds}s.` };
  }

  const [project, submission] = await Promise.all([
    db.project.findUnique({ where: { id: projectId } }),
    db.projectSubmission.findUnique({
      where: { userId_projectId: { userId: session.user.id, projectId } },
    }),
  ]);
  if (!project) return { error: "Projeto não encontrado." };
  if (!submission?.repoUrl) {
    return { error: "Vincule uma URL de repositório à sua submissão antes de pedir uma revisão." };
  }

  const provider = getProviderForPersona("TECH_LEAD");
  const message = [
    `Revise o projeto "${project.title}" submetido por um estudante.`,
    `Repositório informado: ${submission.repoUrl}`,
    submission.decisions ? `Decisões técnicas relatadas pelo estudante: ${submission.decisions}` : "",
    submission.retrospective ? `Retrospectiva do estudante: ${submission.retrospective}` : "",
    project.requirements.length > 0 ? `Requisitos do projeto: ${project.requirements.join("; ")}.` : "",
    "Você não tem acesso direto ao código do repositório — baseie a revisão apenas nas informações acima e nas boas práticas esperadas para esse tipo de projeto.",
    'Responda começando com a linha exata "Nota: X.X" (0 a 10, uma casa decimal) e depois liste as sugestões estruturadas em tópicos.',
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const feedback = await provider.converse({
      persona: "TECH_LEAD",
      message,
      context: {
        completedLessonTitles: [],
        openGoalTitles: [],
        recentQuizScores: [],
      },
    });

    await db.codeReview.create({
      data: {
        submissionId: submission.id,
        score: extractReviewScore(feedback),
        feedback,
        provider: provider.name,
      },
    });

    revalidatePath(`/projects/${projectId}`);
    return { error: null };
  } catch (error) {
    logger.error("request_code_review failed", { projectId, error: String(error) });
    return { error: "Não foi possível gerar a revisão agora. Tente novamente em instantes." };
  }
}
