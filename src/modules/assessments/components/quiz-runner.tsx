"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { submitAttemptAction } from "@/modules/assessments/actions";

type Option = { id: string; text: string; isCorrect: boolean };
type Question = { id: string; order: number; prompt: string; type: string; explanation: string | null; options: Option[] };

export function QuizRunner({ assessmentId, questions }: { assessmentId: string; questions: Question[] }) {
  const router = useRouter();
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const [score, setScore] = React.useState<number | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const startedAt = React.useRef(0);
  React.useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const allAnswered = questions.every((q) => answers[q.id]);

  function selectOption(questionId: string, optionId: string) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  function onSubmit() {
    startTransition(async () => {
      const result = await submitAttemptAction({
        assessmentId,
        answers,
        timeSpentSeconds: Math.round((Date.now() - startedAt.current) / 1000),
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setScore(result.score);
      setSubmitted(true);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {submitted && score !== null ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resultado: {Math.round(score)}%</CardTitle>
          </CardHeader>
        </Card>
      ) : null}

      {questions.map((question, index) => {
        const selected = answers[question.id];
        return (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {index + 1}. {question.prompt}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {question.options.map((option) => {
                const isSelected = selected === option.id;
                const showResult = submitted;
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={submitted}
                    onClick={() => selectOption(question.id, option.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      isSelected && !showResult && "border-primary bg-primary/5",
                      !isSelected && !showResult && "hover:bg-accent/50",
                      showResult && option.isCorrect && "border-green-500 bg-green-500/10",
                      showResult && isSelected && !option.isCorrect && "border-destructive bg-destructive/10"
                    )}
                  >
                    <span>{option.text}</span>
                    {showResult && option.isCorrect ? (
                      <CheckCircle2 className="size-4 text-green-600" />
                    ) : null}
                    {showResult && isSelected && !option.isCorrect ? (
                      <XCircle className="size-4 text-destructive" />
                    ) : null}
                  </button>
                );
              })}
              {submitted && question.explanation ? (
                <p className="pt-1 text-xs text-muted-foreground">{question.explanation}</p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}

      {!submitted ? (
        <Button onClick={onSubmit} disabled={!allAnswered || isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Enviar respostas
        </Button>
      ) : (
        <Button variant="outline" onClick={() => router.refresh()}>
          Ver avaliações
        </Button>
      )}
    </div>
  );
}
