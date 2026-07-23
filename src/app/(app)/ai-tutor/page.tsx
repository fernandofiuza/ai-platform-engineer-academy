import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { AiTutorPanel } from "@/modules/artificial-intelligence/components/ai-tutor-panel";
import { getRecentConversationMessages } from "@/modules/artificial-intelligence/queries";
import { describeRouting } from "@/modules/artificial-intelligence/gateway";
import { getLessonsForLearnPage } from "@/modules/curriculum/queries";

export const metadata: Metadata = { title: "Tutor de IA" };

export default async function AiTutorPage({
  searchParams,
}: {
  searchParams: Promise<{ lessonId?: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;
  const { lessonId } = await searchParams;

  const [lessons, messages] = await Promise.all([
    getLessonsForLearnPage(),
    getRecentConversationMessages(userId),
  ]);

  const routing = describeRouting();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tutor de IA</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Responde perguntas, resume aulas, gera quizzes, explica de outro jeito e sugere a
          próxima atividade, sempre com base no que já está disponível na plataforma. Cada tarefa
          é roteada automaticamente para o provider mais adequado (Gateway de IA).
        </p>
      </div>

      <AiTutorPanel
        lessonOptions={lessons.map((l) => ({ id: l.id, title: l.title }))}
        initialMessages={messages}
        routing={routing}
        initialLessonId={lessonId && lessons.some((l) => l.id === lessonId) ? lessonId : undefined}
      />
    </div>
  );
}
