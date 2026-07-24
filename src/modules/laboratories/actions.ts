"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getProviderForPersona } from "@/modules/artificial-intelligence/gateway";
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

  const { laboratoryId, lessonIds, ...data } = parsed.data;

  if (laboratoryId) {
    await db.laboratory.update({ where: { id: laboratoryId }, data: { ...data, isManuallyEdited: true } });
  } else {
    await db.laboratory.create({
      data: {
        ...data,
        isManuallyEdited: true,
        lessons: { create: lessonIds.map((lessonId) => ({ lessonId })) },
      },
    });
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

function buildLabGenerationMessage(input: {
  scenario: string;
  lessons: { title: string; objective: string | null }[];
}) {
  const lessonList = input.lessons
    .map((l, i) => `${i + 1}. ${l.title}${l.objective ? ` — ${l.objective}` : ""}`)
    .join("\n");

  return [
    `Crie um laboratório prático 100% guiado, passo a passo, para o seguinte cenário: "${input.scenario}".`,
    "",
    "Este laboratório está vinculado ao conteúdo das aulas abaixo — use-as como referência de",
    "quais tecnologias e conceitos o laboratório precisa exercitar na prática (não repita a",
    "teoria da aula, o laboratório é só a prática guiada):",
    lessonList,
    "",
    "REGRAS OBRIGATÓRIAS:",
    "- PROIBIDO usar os projetos internos do curso (ex: 'Labs IA', 'Apex' ou qualquer projeto",
    "  interno do programa) como cenário. Use uma situação real e comum do dia a dia de uma",
    "  empresa em produção — por exemplo: subir uma API interna, configurar um servidor Linux,",
    "  publicar uma aplicação em Kubernetes, montar um pipeline de CI/CD, criar/gerenciar um",
    "  banco de dados, implementar monitoramento e observabilidade, configurar autenticação e",
    "  controle de acesso, integrar serviços entre si, fazer deploy em dev/homologação/produção,",
    "  configurar redes/DNS/proxy/load balancer, backup e alta disponibilidade, automação de",
    "  infraestrutura, ou resolver um incidente real em produção.",
    "- Trate o aluno como uma pessoa completamente leiga em tecnologia: não assuma NENHUM",
    "  conhecimento prévio. Antes de pedir para executar qualquer ação, explique o que ela",
    "  significa e por que está sendo feita. Não pule nenhum passo por mais trivial que pareça",
    "  (inclusive abrir um terminal, instalar uma ferramenta, criar uma pasta, etc).",
    "- Cada passo precisa terminar com o resultado esperado daquele passo específico, para o",
    "  aluno conferir se deu certo antes de seguir para o próximo.",
    "- Seja disciplinado com o orçamento de resposta: não adicione passos extras, seções bônus",
    "  ou digressões (ex: 'como isso seria em outra ferramenta') além do que foi pedido abaixo.",
    "  Se algo relevante merecer uma nota rápida, inclua como uma frase dentro do passo",
    "  relacionado — nunca como um passo ou seção adicional. É mais importante concluir todas as",
    "  seções obrigatórias (principalmente Validação final, Erros comuns e Resumo) do que",
    "  aprofundar demais nos Passos.",
    "",
    "Estruture a resposta em Markdown com exatamente estas seções, nesta ordem:",
    "## Objetivo — 2-3 frases sobre o que o aluno vai construir/praticar e por que isso importa",
    "no dia a dia de uma empresa real.",
    "## Cenário — a situação de negócio/produção simulada, com contexto suficiente para o",
    "laboratório fazer sentido (ex: 'você é o devops recém-contratado de uma empresa X e",
    "precisa...').",
    "## Pré-requisitos — tudo que precisa estar instalado/configurado/disponível antes de",
    "começar (ferramentas, contas, acessos, versões mínimas).",
    "## Passos — numerados ('Passo 1', 'Passo 2', ...), cada um com: o que fazer e por quê, o",
    "comando ou ação exata (bloco de código quando for comando ou arquivo de configuração), e",
    "uma linha 'Resultado esperado:' descrevendo o que o aluno deve ver/conferir para saber que",
    "aquele passo específico funcionou antes de continuar.",
    "## Validação final — um checklist prático confirmando que o cenário completo está",
    "funcionando de ponta a ponta.",
    "## Erros comuns e troubleshooting — pelo menos 4 problemas reais que costumam acontecer",
    "neste tipo de tarefa, a causa provável de cada um, e como resolver.",
    "## Resumo e conceitos aplicados — o que foi aprendido na prática neste laboratório e quais",
    "conceitos das aulas listadas acima foram exercitados.",
  ].join("\n");
}

/**
 * Gera um laboratório guiado passo a passo (persona Professor) vinculado a um conjunto de aulas
 * — um mesmo laboratório pode abranger várias aulas (`LaboratoryLesson`), e uma aula pode ter
 * vários laboratórios. Mesmo padrão de aprovação das demais gerações por IA: salva com
 * `status = DRAFT` até um admin aprovar; recusa se nenhum provider real estiver configurado
 * (evita substituir por resumo genérico do Mock); exige confirmação explícita para sobrescrever
 * um laboratório editado manualmente.
 */
export async function generateLabContentAction(input: {
  laboratoryId?: string;
  lessonIds?: string[];
  weekNumbers?: number[];
  title?: string;
  scenario?: string;
  confirmOverwrite?: boolean;
}) {
  const admin = await assertLabAdmin();
  if (!admin) return { error: "Apenas administradores podem gerenciar laboratórios." };

  let lessonIds = input.lessonIds ?? [];
  if (input.weekNumbers?.length) {
    const weekLessons = await db.lesson.findMany({
      where: { week: { number: { in: input.weekNumbers } } },
      select: { id: true },
    });
    lessonIds = [...new Set([...lessonIds, ...weekLessons.map((l) => l.id)])];
  }
  if (lessonIds.length === 0) {
    return { error: "Selecione ao menos uma aula ou semana para vincular ao laboratório." };
  }

  const lessons = await db.lesson.findMany({
    where: { id: { in: lessonIds } },
    orderBy: [{ week: { number: "asc" } }, { order: "asc" }],
    include: { week: true },
  });
  if (lessons.length === 0) return { error: "Nenhuma aula encontrada para os IDs/semanas informados." };

  let existing = null;
  if (input.laboratoryId) {
    existing = await db.laboratory.findUnique({ where: { id: input.laboratoryId } });
    if (!existing) return { error: "Laboratório não encontrado." };
    if (existing.isManuallyEdited && !input.confirmOverwrite) {
      return {
        error:
          "Este laboratório foi editado manualmente. Confirme explicitamente para gerar e substituir mesmo assim.",
        needsConfirmation: true,
      };
    }
  }

  const provider = getProviderForPersona("PROFESSOR");
  if (provider.name === "mock") {
    return {
      error:
        "Nenhum provider de IA real configurado (AI_OPENAI_API_KEY ou AI_CLAUDE_API_KEY). Nenhum laboratório genérico foi gerado.",
    };
  }

  const scenario = input.scenario?.trim() || input.title?.trim() || lessons[0].title;
  const title = input.title?.trim() || `Laboratório — ${lessons[0].title}`;

  try {
    const instructions = await provider.converse({
      persona: "PROFESSOR",
      message: buildLabGenerationMessage({
        scenario,
        lessons: lessons.map((l) => ({ title: l.title, objective: l.objective })),
      }),
      context: {
        currentLessonTitle: lessons[0].title,
        // Só um resumo curto de cada aula, não o conteúdo inteiro: os títulos/objetivos já vão
        // no prompt (buildLabGenerationMessage), e o laboratório é só prática — não precisa da
        // teoria completa das aulas como contexto. Manter isso pequeno evita prompts de 100k+
        // caracteres quando um laboratório cobre muitas aulas de várias semanas.
        currentLessonContent: lessons
          .map((l) => (l.contentMarkdown ? `${l.title}: ${l.contentMarkdown.slice(0, 400)}...` : null))
          .filter(Boolean)
          .join("\n\n"),
        completedLessonTitles: [],
        openGoalTitles: [],
        recentQuizScores: [],
      },
    });

    const data = {
      title,
      scenario,
      instructions,
      isDemo: false,
      aiGeneratedAt: new Date(),
      status: "DRAFT" as const,
    };

    const lab = existing
      ? await db.laboratory.update({
          where: { id: existing.id },
          data: {
            ...data,
            lessons: {
              deleteMany: {},
              create: lessonIds.map((lessonId) => ({ lessonId })),
            },
          },
        })
      : await db.laboratory.create({
          data: { ...data, lessons: { create: lessonIds.map((lessonId) => ({ lessonId })) } },
        });

    logger.info("admin_action", {
      adminId: admin.id,
      action: "generate_lab_content",
      lessonIds,
      laboratoryId: lab.id,
    });
    for (const week of new Set(lessons.map((l) => l.weekId))) {
      revalidatePath(`/admin/curriculum/${week}`);
    }
    revalidatePath("/admin/labs");
    revalidatePath("/labs");
    revalidatePath(`/labs/${lab.id}`);
    return { error: null, laboratoryId: lab.id };
  } catch (error) {
    logger.error("generate_lab_content failed", { lessonIds, error: String(error) });
    return { error: "Não foi possível gerar o laboratório agora. Tente novamente em instantes." };
  }
}

/** Aprova laboratório gerado por IA: DRAFT -> AVAILABLE. */
export async function approveLabContentAction(laboratoryId: string) {
  const admin = await assertLabAdmin();
  if (!admin) return { error: "Apenas administradores podem gerenciar laboratórios." };

  const lab = await db.laboratory.findUnique({
    where: { id: laboratoryId },
    include: { lessons: { include: { lesson: true } } },
  });
  if (!lab) return { error: "Laboratório não encontrado." };
  if (lab.status !== "DRAFT") return { error: "Este laboratório não está aguardando aprovação." };

  await db.laboratory.update({ where: { id: laboratoryId }, data: { status: "AVAILABLE" } });

  logger.info("admin_action", { adminId: admin.id, action: "approve_lab_content", laboratoryId });
  revalidatePath("/admin/labs");
  revalidatePath("/labs");
  for (const weekId of new Set(lab.lessons.map((ll) => ll.lesson.weekId))) {
    revalidatePath(`/admin/curriculum/${weekId}`);
  }
  return { error: null };
}

async function assertLabAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return null;
  return session.user;
}
