"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/markdown";
import {
  askQuestionAction,
  converseAction,
  explainConceptAction,
  generateQuizAction,
  suggestNextActivityAction,
  summarizeLessonAction,
} from "@/modules/artificial-intelligence/actions";
import { AI_DISCLAIMER, type AIPersona } from "@/modules/artificial-intelligence/types";
import { PERSONA_DESCRIPTIONS, PERSONA_LABELS } from "@/modules/artificial-intelligence/personas";
import type { AITaskType } from "@/modules/artificial-intelligence/gateway";

type LessonOption = { id: string; title: string };
type Message = { id: string; role: "USER" | "ASSISTANT"; content: string; provider: string };

const PERSONA_OPTIONS = Object.keys(PERSONA_LABELS) as AIPersona[];

export function AiTutorPanel({
  lessonOptions,
  initialMessages,
  routing,
}: {
  lessonOptions: LessonOption[];
  initialMessages: Message[];
  routing: Record<AITaskType, string>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [output, setOutput] = React.useState<string | null>(null);

  const [question, setQuestion] = React.useState("");
  const [questionLessonId, setQuestionLessonId] = React.useState("");
  const [summaryLessonId, setSummaryLessonId] = React.useState("");
  const [quizLessonId, setQuizLessonId] = React.useState("");
  const [explainLessonId, setExplainLessonId] = React.useState("");
  const [explainQuestion, setExplainQuestion] = React.useState("");

  const [persona, setPersona] = React.useState<AIPersona>("PROFESSOR");
  const [personaLessonId, setPersonaLessonId] = React.useState("");
  const [personaMessage, setPersonaMessage] = React.useState("");

  function run(fn: () => Promise<{ error: string | null; result: unknown }>, extract: (r: unknown) => string) {
    setOutput(null);
    startTransition(async () => {
      const response = await fn();
      if (response.error) {
        toast.error(response.error);
        return;
      }
      setOutput(extract(response.result));
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="size-4" />
        <AlertDescription>
          {AI_DISCLAIMER} Roteamento atual — ensino: <strong>{routing.TEACH}</strong>, resumo:{" "}
          <strong>{routing.SUMMARIZE}</strong>, revisão de código: <strong>{routing.CODE_REVIEW}</strong>.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="persona">
        <TabsList className="flex-wrap">
          <TabsTrigger value="persona">Conversar com uma persona</TabsTrigger>
          <TabsTrigger value="ask">Perguntar</TabsTrigger>
          <TabsTrigger value="summarize">Resumir aula</TabsTrigger>
          <TabsTrigger value="quiz">Gerar quiz</TabsTrigger>
          <TabsTrigger value="explain">Explicar de outro jeito</TabsTrigger>
          <TabsTrigger value="suggest">Próxima atividade</TabsTrigger>
        </TabsList>

        <TabsContent value="persona" className="mt-4 space-y-3">
          <Select value={persona} onValueChange={(value) => setPersona(value as AIPersona)}>
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERSONA_OPTIONS.map((p) => (
                <SelectItem key={p} value={p}>
                  {PERSONA_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">{PERSONA_DESCRIPTIONS[persona]}</p>

          <Select value={personaLessonId} onValueChange={setPersonaLessonId}>
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder="Contexto: nenhuma aula específica" />
            </SelectTrigger>
            <SelectContent>
              {lessonOptions.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Textarea
            value={personaMessage}
            onChange={(e) => setPersonaMessage(e.target.value)}
            placeholder={
              persona === "TECH_LEAD"
                ? "Cole um trecho de código ou descreva o que quer revisar..."
                : persona === "ARQUITETO"
                  ? "Descreva o problema que quer arquitetar..."
                  : persona === "ENTREVISTADOR"
                    ? "Informe o tema da entrevista técnica..."
                    : persona === "CLIENTE"
                      ? "Informe o tema do sistema que o cliente vai descrever..."
                      : "Faça uma pergunta ou peça uma explicação..."
            }
            rows={4}
          />
          <Button
            disabled={isPending || !personaMessage.trim()}
            onClick={() =>
              run(
                () =>
                  converseAction({
                    persona,
                    message: personaMessage,
                    lessonId: personaLessonId || undefined,
                  }),
                (r) => (r as { response: string }).response
              )
            }
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Conversar como {PERSONA_LABELS[persona]}
          </Button>
        </TabsContent>

        <TabsContent value="ask" className="mt-4 space-y-3">
          <Select value={questionLessonId} onValueChange={setQuestionLessonId}>
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder="Contexto: nenhuma aula específica" />
            </SelectTrigger>
            <SelectContent>
              {lessonOptions.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Faça uma pergunta sobre o conteúdo disponível..."
            rows={3}
          />
          <Button
            disabled={isPending || !question.trim()}
            onClick={() =>
              run(
                () => askQuestionAction({ question, lessonId: questionLessonId || undefined }),
                (r) => (r as { answer: string }).answer
              )
            }
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Perguntar
          </Button>
        </TabsContent>

        <TabsContent value="summarize" className="mt-4 space-y-3">
          <Select value={summaryLessonId} onValueChange={setSummaryLessonId}>
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder="Selecione uma aula" />
            </SelectTrigger>
            <SelectContent>
              {lessonOptions.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            disabled={isPending || !summaryLessonId}
            onClick={() =>
              run(
                () => summarizeLessonAction({ lessonId: summaryLessonId }),
                (r) => (r as { summary: string }).summary
              )
            }
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Resumir
          </Button>
        </TabsContent>

        <TabsContent value="quiz" className="mt-4 space-y-3">
          <Select value={quizLessonId} onValueChange={setQuizLessonId}>
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder="Selecione uma aula" />
            </SelectTrigger>
            <SelectContent>
              {lessonOptions.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            disabled={isPending || !quizLessonId}
            onClick={() =>
              run(
                () => generateQuizAction({ lessonId: quizLessonId }),
                (r) =>
                  (r as { quiz: { question: string; answer: string }[] }).quiz
                    .map((q, i) => `${i + 1}. ${q.question}\n   ${q.answer}`)
                    .join("\n\n")
              )
            }
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Gerar quiz
          </Button>
        </TabsContent>

        <TabsContent value="explain" className="mt-4 space-y-3">
          <Select value={explainLessonId} onValueChange={setExplainLessonId}>
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder="Selecione uma aula" />
            </SelectTrigger>
            <SelectContent>
              {lessonOptions.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            value={explainQuestion}
            onChange={(e) => setExplainQuestion(e.target.value)}
            placeholder="O que especificamente você não entendeu? (opcional)"
            rows={2}
          />
          <Button
            disabled={isPending || !explainLessonId}
            onClick={() =>
              run(
                () =>
                  explainConceptAction({
                    lessonId: explainLessonId,
                    question: explainQuestion || undefined,
                  }),
                (r) => (r as { explanation: string }).explanation
              )
            }
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Explicar de outro jeito
          </Button>
        </TabsContent>

        <TabsContent value="suggest" className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Considera aulas concluídas, metas em aberto e notas recentes de avaliações.
          </p>
          <Button
            disabled={isPending}
            onClick={() =>
              run(
                () => suggestNextActivityAction(),
                (r) => (r as { suggestion: string }).suggestion
              )
            }
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Sugerir
          </Button>
        </TabsContent>
      </Tabs>

      {output ? (
        <Card>
          <CardContent className="pt-6">
            <Markdown content={output} />
          </CardContent>
        </Card>
      ) : null}

      {initialMessages.length > 0 ? (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">Histórico recente</h2>
          <div className="mt-2 space-y-2">
            {initialMessages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "USER"
                    ? "rounded-md bg-accent/50 px-3 py-2 text-sm"
                    : "rounded-md border px-3 py-2 text-sm text-muted-foreground"
                }
              >
                {message.content}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
