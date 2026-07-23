"use server";

import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { getProviderForPersona } from "@/modules/artificial-intelligence/gateway";
import { parseArchitectureComponents, type ArchitectureComponent } from "./parser";
import { requestArchitectureSchema, type RequestArchitectureInput } from "./schema";

export type ArchitectureSuggestion = {
  components: ArchitectureComponent[];
  raw: string;
  provider: string;
};

/**
 * IA de Arquitetura (Etapa 7): usa a persona Arquiteto para sugerir componentes + justificativa
 * a partir de uma descrição de problema em texto livre. Sempre tratada como sugestão para
 * avaliação humana — nunca aplicada automaticamente a nada no sistema (não há write algum além
 * do rate limit em memória).
 */
export async function requestArchitectureSuggestionAction(input: RequestArchitectureInput) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Faça login novamente.", result: null };

  const parsed = requestArchitectureSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Descreva o problema com mais detalhes.", result: null };
  }

  const rateLimit = checkRateLimit(`architecture:${session.user.id}`, {
    windowMs: 10 * 60 * 1000,
    maxRequests: 10,
  });
  if (!rateLimit.allowed) {
    return {
      error: `Muitas solicitações. Tente novamente em ${rateLimit.retryAfterSeconds}s.`,
      result: null,
    };
  }

  const provider = getProviderForPersona("ARQUITETO");
  const message = [
    `Problema: ${parsed.data.problem}`,
    "Sugira uma arquitetura para esse problema.",
    'Responda APENAS com uma lista, uma linha por componente, no formato exato "- **Nome do componente**: justificativa da escolha (por que esse componente e não outra opção)." Não escreva nada antes ou depois da lista.',
  ].join("\n");

  try {
    const raw = await provider.converse({
      persona: "ARQUITETO",
      message,
      context: { completedLessonTitles: [], openGoalTitles: [], recentQuizScores: [] },
    });

    const components = parseArchitectureComponents(raw);

    const result: ArchitectureSuggestion = { components, raw, provider: provider.name };
    return { error: null, result };
  } catch (error) {
    logger.error("request_architecture_suggestion failed", { error: String(error) });
    return { error: "Não foi possível gerar a sugestão agora. Tente novamente em instantes.", result: null };
  }
}
