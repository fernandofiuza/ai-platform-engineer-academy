import type { AIContext, AIProvider, GeneratedQuizItem } from "./types";

function stripMarkdown(content: string) {
  return content
    .replace(/[#>*_`]/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSentences(content: string) {
  return stripMarkdown(content)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);
}

/**
 * Provider heurístico e determinístico — sem chamadas externas. Serve como padrão de fábrica
 * (AI_PROVIDER=mock) para que o sistema funcione sem nenhuma chave de IA configurada.
 */
export class MockAIProvider implements AIProvider {
  readonly name = "mock";

  async generateAnswer({
    question,
    context,
  }: {
    question: string;
    context: AIContext;
  }): Promise<string> {
    const normalizedQuestion = question.toLowerCase();

    if (context.currentLessonContent) {
      const sentences = splitSentences(context.currentLessonContent);
      const questionWords = normalizedQuestion
        .split(/\s+/)
        .filter((w) => w.length > 3);
      const match = sentences.find((sentence) =>
        questionWords.some((word) => sentence.toLowerCase().includes(word))
      );
      if (match) {
        return `Com base na aula "${context.currentLessonTitle}": ${match}`;
      }
    }

    const completed = context.completedLessonTitles.length;
    return completed > 0
      ? `Ainda não encontrei essa informação no conteúdo disponível. Você já concluiu ${completed} aula(s) — experimente reformular a pergunta ou revisar o conteúdo da aula atual.`
      : "Ainda não encontrei essa informação no conteúdo disponível. Comece pela Semana 0 ou pelas aulas em /learn para eu ter mais contexto.";
  }

  async summarizeContent({ content }: { content: string }): Promise<string> {
    const sentences = splitSentences(content);
    if (sentences.length === 0) {
      return "Não há conteúdo suficiente para resumir.";
    }
    const summary = sentences.slice(0, 2).join(" ");
    return `${summary} (resumo automático simplificado — provider mock)`;
  }

  async generateQuiz({ content }: { content: string }): Promise<GeneratedQuizItem[]> {
    const sentences = splitSentences(content).slice(0, 3);
    if (sentences.length === 0) {
      return [
        {
          question: "Não há conteúdo suficiente para gerar um quiz automático.",
          answer: "—",
        },
      ];
    }
    return sentences.map((sentence) => ({
      question: `Verdadeiro ou falso: "${sentence}"`,
      answer: "Verdadeiro (extraído diretamente do conteúdo da aula)",
    }));
  }

  async suggestNextActivity({ context }: { context: AIContext }): Promise<string> {
    if (context.openGoalTitles.length > 0) {
      return `Você tem ${context.openGoalTitles.length} meta(s) em aberto — que tal avançar em "${context.openGoalTitles[0]}"?`;
    }
    if (context.completedLessonTitles.length === 0) {
      return "Comece pela Semana 0 (preparação do ambiente) ou pela primeira aula disponível em /learn.";
    }
    if (context.recentQuizScores.some((score) => score < 70)) {
      return "Sua última avaliação ficou abaixo de 70% — vale revisar os flashcards relacionados antes de seguir em frente.";
    }
    return "Continue pelo roadmap ou revise seus flashcards pendentes em /flashcards.";
  }

  async explainConcept({ content, question }: { content: string; question?: string }): Promise<string> {
    const sentences = splitSentences(content);
    if (sentences.length === 0) {
      return "Não há conteúdo suficiente para explicar de outra forma.";
    }
    const bullets = sentences.slice(0, 4).map((s) => `- ${s}`).join("\n");
    const intro = question
      ? `Explicando "${question}" de outro jeito:`
      : "Explicando de outro jeito, em tópicos:";
    return `${intro}\n${bullets}`;
  }
}
