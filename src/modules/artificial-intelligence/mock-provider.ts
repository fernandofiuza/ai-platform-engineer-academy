import type { AIContext, AIPersona, AIProvider, GeneratedQuizItem } from "./types";
import { PERSONA_LABELS } from "./personas";

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
 * Provider heurístico e determinístico — sem chamadas externas. É o fallback automático do AI
 * Gateway (`gateway.ts`) para qualquer tarefa cujo provider real não tenha chave configurada,
 * garantindo que o sistema funcione sem nenhuma chave de IA.
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

  async converse({
    persona,
    message,
    context,
  }: {
    persona: AIPersona;
    message: string;
    context: AIContext;
  }): Promise<string> {
    const label = PERSONA_LABELS[persona];
    const mockNote = "(resposta heurística do provider mock — configure uma chave real para uma resposta genuína)";

    switch (persona) {
      case "PROFESSOR": {
        const source = context.currentLessonContent ?? message;
        const sentences = splitSentences(source).slice(0, 3);
        const bullets = sentences.length > 0 ? sentences.map((s) => `- ${s}`).join("\n") : `- ${message}`;
        return `[${label}] Focando nos 20% que mais importam sobre "${message}":\n${bullets}\n\n${mockNote}`;
      }
      case "TECH_LEAD": {
        return `[${label}] Nota: 7.0 (revisão heurística — sem chave de IA real configurada).\nSugestões genéricas: separar Service/Repository/Controller, adicionar testes automatizados, revisar nomes de variáveis para maior clareza.\n\nEsta é uma avaliação assistida por IA, não uma nota oficial. ${mockNote}`;
      }
      case "ARQUITETO": {
        return `[${label}] Arquitetura sugerida (esqueleto genérico) para "${message}":\n- API (camada de entrada)\n- Serviço de domínio\n- Banco de dados\n- Cache (se necessário)\n- Observabilidade (logs/métricas)\n\n${mockNote}`;
      }
      case "ENTREVISTADOR": {
        return `[${label}] Pergunta 1 sobre "${message}": explique os principais conceitos envolvidos e descreva um caso de uso real onde você já aplicou (ou aplicaria) isso.\n\n${mockNote}`;
      }
      case "CLIENTE": {
        return `[${label}] Preciso de uma solução relacionada a "${message}" para o meu negócio. Não sou técnico — me explique as opções em termos simples e me diga o que você recomendaria.\n\n${mockNote}`;
      }
      default:
        return `[${label}] ${mockNote}`;
    }
  }
}
