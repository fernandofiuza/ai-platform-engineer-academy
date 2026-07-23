import { logger } from "@/lib/logger";
import { MockAIProvider } from "./mock-provider";
import { OpenAIProvider } from "./openai-provider";
import type { AIProvider } from "./types";

let cachedProvider: AIProvider | null = null;

/**
 * AI_PROVIDER=mock (padrão) roda 100% local, sem chave nenhuma. AI_PROVIDER=openai ativa o
 * provider real — só chamado no servidor (ver actions.ts), nunca no navegador. Se
 * AI_PROVIDER=openai mas AI_API_KEY não estiver configurada, cai para o mock em vez de quebrar
 * o tutor — o sistema principal nunca deve depender de uma chave de IA para funcionar.
 */
export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = process.env.AI_PROVIDER || "mock";
  if (providerName === "openai" && !process.env.AI_API_KEY) {
    logger.warn("AI_PROVIDER=openai sem AI_API_KEY — usando MockAIProvider como fallback");
    cachedProvider = new MockAIProvider();
  } else {
    cachedProvider = providerName === "openai" ? new OpenAIProvider() : new MockAIProvider();
  }
  return cachedProvider;
}
