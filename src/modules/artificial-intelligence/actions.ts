"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { buildContextForUser } from "./context";
import { getProviderForTask } from "./gateway";
import { checkRateLimit } from "./rate-limit";
import {
  askQuestionSchema,
  explainConceptSchema,
  generateQuizSchema,
  summarizeLessonSchema,
  type AskQuestionInput,
  type ExplainConceptInput,
  type GenerateQuizInput,
  type SummarizeLessonInput,
} from "./schema";

type ActionResult<T> = { error: string | null; result: T | null };

async function getOrCreateConversation(userId: string) {
  const existing = await db.aIConversation.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;
  return db.aIConversation.create({ data: { userId } });
}

async function logExchange(conversationId: string, userText: string, assistantText: string, provider: string) {
  await db.aIMessage.createMany({
    data: [
      { conversationId, role: "USER", content: userText, provider },
      { conversationId, role: "ASSISTANT", content: assistantText, provider },
    ],
  });
}

async function withAIGuardrails<T>(
  action: string,
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Sessão expirada. Faça login novamente.", result: null };
  }

  const rateLimit = checkRateLimit(session.user.id);
  if (!rateLimit.allowed) {
    return {
      error: `Muitas solicitações ao tutor de IA. Tente novamente em ${rateLimit.retryAfterSeconds}s.`,
      result: null,
    };
  }

  try {
    const result = await fn();
    logger.info("ai tutor request", { action, userId: session.user.id });
    return { error: null, result };
  } catch (error) {
    logger.error("ai tutor request failed", { action, error: String(error) });
    return {
      error: "O tutor de IA não conseguiu responder agora. Tente novamente em instantes.",
      result: null,
    };
  }
}

export async function askQuestionAction(input: AskQuestionInput) {
  return withAIGuardrails("ask_question", async () => {
    const session = await auth();
    const parsed = askQuestionSchema.parse(input);
    const provider = getProviderForTask("TEACH");
    const context = await buildContextForUser(session!.user.id, parsed.lessonId);

    const answer = await provider.generateAnswer({ question: parsed.question, context });

    const conversation = await getOrCreateConversation(session!.user.id);
    await logExchange(conversation.id, `[Perguntar] ${parsed.question}`, answer, provider.name);

    revalidatePath("/ai-tutor");
    return { answer, provider: provider.name };
  });
}

export async function summarizeLessonAction(input: SummarizeLessonInput) {
  return withAIGuardrails("summarize_lesson", async () => {
    const session = await auth();
    const parsed = summarizeLessonSchema.parse(input);
    const lesson = await db.lesson.findUnique({ where: { id: parsed.lessonId } });
    if (!lesson?.contentMarkdown) throw new Error("Aula sem conteúdo para resumir.");

    const provider = getProviderForTask("SUMMARIZE");
    const summary = await provider.summarizeContent({ content: lesson.contentMarkdown });

    const conversation = await getOrCreateConversation(session!.user.id);
    await logExchange(conversation.id, `[Resumir aula] ${lesson.title}`, summary, provider.name);

    revalidatePath("/ai-tutor");
    return { summary, provider: provider.name };
  });
}

export async function generateQuizAction(input: GenerateQuizInput) {
  return withAIGuardrails("generate_quiz", async () => {
    const session = await auth();
    const parsed = generateQuizSchema.parse(input);
    const lesson = await db.lesson.findUnique({ where: { id: parsed.lessonId } });
    if (!lesson?.contentMarkdown) throw new Error("Aula sem conteúdo para gerar quiz.");

    const provider = getProviderForTask("TEACH");
    const quiz = await provider.generateQuiz({ content: lesson.contentMarkdown });

    const conversation = await getOrCreateConversation(session!.user.id);
    const quizText = quiz.map((q, i) => `${i + 1}. ${q.question} (${q.answer})`).join("\n");
    await logExchange(conversation.id, `[Gerar quiz] ${lesson.title}`, quizText, provider.name);

    revalidatePath("/ai-tutor");
    return { quiz, provider: provider.name };
  });
}

export async function suggestNextActivityAction() {
  return withAIGuardrails("suggest_next_activity", async () => {
    const session = await auth();
    const provider = getProviderForTask("TEACH");
    const context = await buildContextForUser(session!.user.id);

    const suggestion = await provider.suggestNextActivity({ context });

    const conversation = await getOrCreateConversation(session!.user.id);
    await logExchange(conversation.id, "[Sugerir próxima atividade]", suggestion, provider.name);

    revalidatePath("/ai-tutor");
    return { suggestion, provider: provider.name };
  });
}

export async function explainConceptAction(input: ExplainConceptInput) {
  return withAIGuardrails("explain_concept", async () => {
    const session = await auth();
    const parsed = explainConceptSchema.parse(input);
    const lesson = await db.lesson.findUnique({ where: { id: parsed.lessonId } });
    if (!lesson?.contentMarkdown) throw new Error("Aula sem conteúdo para explicar.");

    const provider = getProviderForTask("TEACH");
    const explanation = await provider.explainConcept({
      content: lesson.contentMarkdown,
      question: parsed.question,
    });

    const conversation = await getOrCreateConversation(session!.user.id);
    await logExchange(
      conversation.id,
      `[Explicar de outro jeito] ${lesson.title}`,
      explanation,
      provider.name
    );

    revalidatePath("/ai-tutor");
    return { explanation, provider: provider.name };
  });
}
