// Interface desacoplada do tutor de IA, implementada por múltiplos adapters (OpenAI, Claude,
// Gemini, Mock) e roteada pelo AI Gateway (`gateway.ts`) por tipo de tarefa. Nenhuma chamada de
// IA acontece no navegador — só em server actions. O sistema principal funciona 100% sem
// nenhuma chave de provider configurada (fallback automático para o Mock). Ver
// docs/ARCHITECTURE.md e docs/DECISIONS.md.

export type AIContext = {
  currentLessonTitle?: string;
  currentLessonContent?: string;
  completedLessonTitles: string[];
  openGoalTitles: string[];
  recentQuizScores: number[];
};

export type GeneratedQuizItem = {
  question: string;
  answer: string;
};

/**
 * Personas do Mentor de IA (Etapa 2): cada uma é apenas um prompt de sistema especializado,
 * roteado pelo mesmo AI Gateway da Etapa 1 — não são agentes independentes nem multiagentes de
 * verdade (isso fica para uma fase futura). Ver `personas.ts` e `docs/DECISIONS.md`.
 */
export type AIPersona = "PROFESSOR" | "TECH_LEAD" | "ARQUITETO" | "ENTREVISTADOR" | "CLIENTE";

export interface AIProvider {
  readonly name: string;
  generateAnswer(input: { question: string; context: AIContext }): Promise<string>;
  summarizeContent(input: { content: string }): Promise<string>;
  generateQuiz(input: { content: string }): Promise<GeneratedQuizItem[]>;
  suggestNextActivity(input: { context: AIContext }): Promise<string>;
  explainConcept(input: { content: string; question?: string }): Promise<string>;
  converse(input: { persona: AIPersona; message: string; context: AIContext }): Promise<string>;
}

export const MAX_INPUT_LENGTH = 4000;

export const AI_DISCLAIMER =
  "Respostas geradas automaticamente podem conter erros — confira sempre o conteúdo oficial.";
