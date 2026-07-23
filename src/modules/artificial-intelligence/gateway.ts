import { logger } from "@/lib/logger";
import { MockAIProvider } from "./mock-provider";
import { OpenAIProvider } from "./openai-provider";
import { ClaudeProvider } from "./claude-provider";
import { GeminiProvider } from "./gemini-provider";
import type { AIPersona, AIProvider } from "./types";

/**
 * AI Gateway: centraliza o acesso a múltiplos providers (OpenAI, Claude, Gemini, Mock) e decide
 * qual usar por **tipo de tarefa**, com uma regra fixa e determinística (não é uma IA decidindo
 * por outra IA):
 *   - TEACH (perguntas, explicações, quiz, sugestão de atividade): OpenAI ou Claude, configurável
 *     via `AI_TEACHING_PROVIDER` (padrão: openai);
 *   - CODE_REVIEW (revisão de código de projetos/laboratórios): sempre Claude;
 *   - SUMMARIZE (resumo de conteúdo longo): sempre Gemini.
 * Se o provider escolhido não tiver a chave de API correspondente configurada, o Gateway cai
 * automaticamente para o `MockAIProvider` (nunca lança erro nem quebra o produto) — ver
 * docs/DECISIONS.md.
 *
 * Um `OllamaProvider` (execução local) fica fora desta fase por custo de performance na máquina
 * do aluno — a interface `AIProvider` já é genérica o suficiente para recebê-lo no futuro sem
 * mudar o Gateway.
 */
export type AITaskType = "TEACH" | "CODE_REVIEW" | "SUMMARIZE";

type ProviderKind = "openai" | "claude" | "gemini";

function resolveProviderKind(taskType: AITaskType): ProviderKind {
  switch (taskType) {
    case "CODE_REVIEW":
      return "claude";
    case "SUMMARIZE":
      return "gemini";
    case "TEACH":
    default:
      return process.env.AI_TEACHING_PROVIDER === "claude" ? "claude" : "openai";
  }
}

function isConfigured(kind: ProviderKind): boolean {
  if (kind === "openai") return Boolean(process.env.AI_OPENAI_API_KEY);
  if (kind === "claude") return Boolean(process.env.AI_CLAUDE_API_KEY);
  return Boolean(process.env.AI_GEMINI_API_KEY);
}

const providerCache = new Map<ProviderKind | "mock", AIProvider>();

function getMock(): AIProvider {
  if (!providerCache.has("mock")) providerCache.set("mock", new MockAIProvider());
  return providerCache.get("mock")!;
}

function getReal(kind: ProviderKind): AIProvider {
  if (!providerCache.has(kind)) {
    const instance =
      kind === "openai" ? new OpenAIProvider() : kind === "claude" ? new ClaudeProvider() : new GeminiProvider();
    providerCache.set(kind, instance);
  }
  return providerCache.get(kind)!;
}

/** Retorna o provider correto para a tarefa, com fallback automático para o Mock. */
export function getProviderForTask(taskType: AITaskType): AIProvider {
  const kind = resolveProviderKind(taskType);

  if (!isConfigured(kind)) {
    logger.warn("AI Gateway: provider sem chave configurada — usando MockAIProvider", {
      taskType,
      kind,
    });
    return getMock();
  }

  return getReal(kind);
}

/**
 * Personas (Etapa 2) reaproveitam o mesmo roteamento por tarefa: Tech Lead é uma revisão de
 * código (CODE_REVIEW → Claude), as demais são conversas de ensino (TEACH). Isso é só troca de
 * prompt de sistema (`buildPersonaSystemPrompt` em `personas.ts`) — não é uma tarefa nova nem
 * multiagentes.
 */
export function getProviderForPersona(persona: AIPersona): AIProvider {
  return getProviderForTask(persona === "TECH_LEAD" ? "CODE_REVIEW" : "TEACH");
}

/** Lista, para exibição/depuração, qual provider seria usado em cada tipo de tarefa hoje. */
export function describeRouting(): Record<AITaskType, string> {
  return {
    TEACH: getProviderForTask("TEACH").name,
    CODE_REVIEW: getProviderForTask("CODE_REVIEW").name,
    SUMMARIZE: getProviderForTask("SUMMARIZE").name,
  };
}
