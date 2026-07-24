"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Archive, ChevronDown, Check, Loader2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  approveLessonContentAction,
  archiveLessonAction,
  generateLessonContentAction,
  saveLessonAction,
} from "@/modules/admin-curriculum/actions";
import { STATUS_LABELS } from "@/modules/curriculum/status";
import { LessonLabPanel } from "@/modules/laboratories/components/lesson-lab-panel";
import type { ContentStatus } from "@/generated/prisma/enums";
import { FlashcardManager } from "./flashcard-manager";
import { QuizManager } from "./quiz-manager";

const STATUSES: ContentStatus[] = ["DRAFT", "PLANNED", "AVAILABLE", "IN_PROGRESS", "COMPLETED", "ARCHIVED"];

type Lesson = {
  id: string;
  order: number;
  title: string;
  objective: string | null;
  durationMinutes: number | null;
  contentMarkdown: string | null;
  status: ContentStatus;
  isManuallyEdited: boolean;
  aiGeneratedAt: Date | null;
  flashcards: { id: string; question: string; answer: string }[];
  assessments: {
    questions: { id: string; prompt: string; options: { id: string; text: string; isCorrect: boolean }[] }[];
  }[];
  laboratories: {
    laboratory: { id: string; title: string; status: ContentStatus; aiGeneratedAt: Date | null };
  }[];
};

export function LessonEditor({ weekId, lesson, nextOrder }: { weekId: string; lesson?: Lesson; nextOrder: number }) {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState(!lesson);
  const [isPending, startTransition] = React.useTransition();
  const [title, setTitle] = React.useState(lesson?.title ?? "");
  const [objective, setObjective] = React.useState(lesson?.objective ?? "");
  const [durationMinutes, setDurationMinutes] = React.useState(String(lesson?.durationMinutes ?? ""));
  const [contentMarkdown, setContentMarkdown] = React.useState(lesson?.contentMarkdown ?? "");
  const [status, setStatus] = React.useState<ContentStatus>(lesson?.status ?? "PLANNED");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveLessonAction({
        lessonId: lesson?.id,
        weekId,
        order: lesson?.order ?? nextOrder,
        title,
        objective: objective || undefined,
        durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
        contentMarkdown: contentMarkdown || undefined,
        status,
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(lesson ? "Aula atualizada." : "Aula criada.");
      if (!lesson) {
        setTitle("");
        setObjective("");
        setDurationMinutes("");
        setContentMarkdown("");
      }
      router.refresh();
    });
  }

  function onArchive() {
    if (!lesson) return;
    startTransition(async () => {
      await archiveLessonAction(lesson.id);
      router.refresh();
    });
  }

  function onGenerate(confirmOverwrite = false) {
    if (!lesson) return;
    startTransition(async () => {
      const result = await generateLessonContentAction(lesson.id, confirmOverwrite);
      if (result?.error) {
        if (result.needsConfirmation && window.confirm(`${result.error}\n\nGerar mesmo assim?`)) {
          onGenerate(true);
          return;
        }
        toast.error(result.error);
        return;
      }
      toast.success("Conteúdo gerado por IA — revise e aprove abaixo.");
      router.refresh();
    });
  }

  function onApprove() {
    if (!lesson) return;
    startTransition(async () => {
      const result = await approveLessonContentAction(lesson.id);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Conteúdo aprovado e publicado.");
      router.refresh();
    });
  }

  const allQuestions = lesson?.assessments.flatMap((a) => a.questions) ?? [];

  return (
    <Card>
      <CardHeader
        className="cursor-pointer flex-row items-center justify-between gap-2 space-y-0"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{lesson ? lesson.title : "Nova aula"}</span>
          {lesson ? <Badge variant="secondary">{STATUS_LABELS[lesson.status]}</Badge> : null}
        </div>
        <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
      </CardHeader>
      {expanded ? (
        <CardContent className="space-y-4" onClick={(e) => e.stopPropagation()}>
          {lesson?.status === "DRAFT" && lesson.aiGeneratedAt ? (
            <Alert>
              <Sparkles className="size-4" />
              <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  Conteúdo gerado por IA em {lesson.aiGeneratedAt.toLocaleString("pt-BR")} —
                  aguardando revisão. Não é publicado para os estudantes até ser aprovado.
                </span>
                <Button type="button" size="sm" onClick={onApprove} disabled={isPending}>
                  <Check className="size-4" /> Aprovar e publicar
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          {lesson ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onGenerate(false)}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {lesson.aiGeneratedAt ? "Gerar novamente com IA" : "Gerar conteúdo com IA"}
            </Button>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Título</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Duração (min)</Label>
                <Input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Objetivo</Label>
              <Input value={objective} onChange={(e) => setObjective(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Conteúdo (Markdown)</Label>
              <Textarea
                value={contentMarkdown}
                onChange={(e) => setContentMarkdown(e.target.value)}
                rows={5}
              />
            </div>
            <div className="flex items-end gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isPending || !title}>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Salvar
              </Button>
              {lesson ? (
                <Button type="button" variant="ghost" onClick={onArchive} disabled={isPending}>
                  <Archive className="size-4" /> Arquivar
                </Button>
              ) : null}
            </div>
          </form>

          {lesson ? (
            <div className="border-t pt-4">
              <LessonLabPanel
                lessonId={lesson.id}
                laboratories={lesson.laboratories.map((ll) => ll.laboratory)}
              />
            </div>
          ) : null}

          {lesson ? (
            <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
              <FlashcardManager lessonId={lesson.id} weekId={weekId} flashcards={lesson.flashcards} />
              <QuizManager lessonId={lesson.id} weekId={weekId} questions={allQuestions} />
            </div>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  );
}
