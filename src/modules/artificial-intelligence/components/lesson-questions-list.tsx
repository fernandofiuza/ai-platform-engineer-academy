"use client";

import * as React from "react";
import { ChevronDown, MessageCircleQuestion } from "lucide-react";

import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";

type LessonQuestionItem = {
  id: string;
  question: string;
  answer: string;
  userName: string;
  createdAt: Date;
};

export function LessonQuestionsList({ questions }: { questions: LessonQuestionItem[] }) {
  const [openId, setOpenId] = React.useState<string | null>(questions[0]?.id ?? null);

  if (questions.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <MessageCircleQuestion className="size-4" /> Perguntas de outros alunos sobre esta aula
      </h2>
      <div className="divide-y rounded-lg border">
        {questions.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="flex w-full items-start justify-between gap-3 p-3 text-left hover:bg-muted/50"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{item.question}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.userName} ·{" "}
                    {item.createdAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "mt-1 size-4 shrink-0 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </button>
              {isOpen ? (
                <div className="border-t bg-muted/20 p-3">
                  <Markdown content={item.answer} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
