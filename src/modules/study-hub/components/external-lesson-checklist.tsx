"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  createExternalLessonAction,
  createExternalModuleAction,
  deleteExternalLessonAction,
  deleteExternalModuleAction,
  toggleExternalLessonCompletionAction,
} from "@/modules/study-hub/actions";

type Lesson = {
  id: string;
  title: string;
  completed: boolean;
  markedForReview: boolean;
};

type Module = {
  id: string;
  title: string;
  lessons: Lesson[];
};

export function ExternalLessonChecklist({
  courseId,
  modules,
  totalLessons,
  completedLessons,
  progressPercent,
}: {
  courseId: string;
  modules: Module[];
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}) {
  const router = useRouter();
  const [pendingLesson, setPendingLesson] = React.useState<string | null>(null);
  const [optimistic, setOptimistic] = React.useState<Record<string, boolean>>({});
  const [isPending, startTransition] = React.useTransition();
  const [newModuleTitle, setNewModuleTitle] = React.useState("");
  const [newLessonTitle, setNewLessonTitle] = React.useState<Record<string, string>>({});

  function isCompleted(lesson: Lesson) {
    return optimistic[lesson.id] ?? lesson.completed;
  }

  async function toggleLesson(lesson: Lesson) {
    setOptimistic((prev) => ({ ...prev, [lesson.id]: !isCompleted(lesson) }));
    setPendingLesson(lesson.id);
    const result = await toggleExternalLessonCompletionAction(lesson.id);
    setPendingLesson(null);
    if (result?.error) {
      toast.error(result.error);
      setOptimistic((prev) => ({ ...prev, [lesson.id]: lesson.completed }));
      return;
    }
    router.refresh();
  }

  function addModule(e: React.FormEvent) {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;
    startTransition(async () => {
      const result = await createExternalModuleAction({ courseId, title: newModuleTitle.trim() });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setNewModuleTitle("");
      router.refresh();
    });
  }

  function addLesson(moduleId: string) {
    const title = (newLessonTitle[moduleId] ?? "").trim();
    if (!title) return;
    startTransition(async () => {
      const result = await createExternalLessonAction({ moduleId, title });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setNewLessonTitle((prev) => ({ ...prev, [moduleId]: "" }));
      router.refresh();
    });
  }

  function removeModule(moduleId: string) {
    if (!window.confirm("Excluir este módulo e todas as aulas dele?")) return;
    startTransition(async () => {
      const result = await deleteExternalModuleAction(moduleId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function removeLesson(lessonId: string) {
    if (!window.confirm("Excluir esta aula?")) return;
    startTransition(async () => {
      const result = await deleteExternalLessonAction(lessonId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Progress value={progressPercent} className="h-2" />
        <span className="shrink-0 text-sm text-muted-foreground">
          {completedLessons}/{totalLessons} ({progressPercent}%)
        </span>
      </div>

      {modules.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum módulo ainda. Adicione o primeiro módulo abaixo.
        </p>
      ) : null}

      {modules.map((courseModule) => (
        <div key={courseModule.id}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium">{courseModule.title}</h3>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Excluir módulo "${courseModule.title}"`}
              onClick={() => removeModule(courseModule.id)}
            >
              <Trash2 className="size-3.5 text-muted-foreground" />
            </Button>
          </div>

          <div className="mt-2 divide-y rounded-lg border">
            {courseModule.lessons.length === 0 ? (
              <p className="px-3 py-2.5 text-sm text-muted-foreground">Nenhuma aula ainda.</p>
            ) : null}
            {courseModule.lessons.map((lesson) => (
              <div key={lesson.id} className="flex items-center gap-3 px-3 py-2.5">
                <Checkbox
                  checked={isCompleted(lesson)}
                  onCheckedChange={() => void toggleLesson(lesson)}
                  aria-label={`Marcar "${lesson.title}" como concluída`}
                />
                <Link
                  href={`/study-hub/courses/${courseId}/lessons/${lesson.id}`}
                  className={cn(
                    "flex-1 text-sm hover:underline",
                    isCompleted(lesson) && "text-muted-foreground line-through"
                  )}
                >
                  {lesson.title}
                </Link>
                {lesson.markedForReview ? (
                  <Badge variant="outline" className="gap-1">
                    <RefreshCw className="size-3" /> revisar
                  </Badge>
                ) : null}
                {pendingLesson === lesson.id ? (
                  <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Excluir aula "${lesson.title}"`}
                  onClick={() => removeLesson(lesson.id)}
                >
                  <Trash2 className="size-3.5 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>

          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              addLesson(courseModule.id);
            }}
          >
            <Input
              value={newLessonTitle[courseModule.id] ?? ""}
              onChange={(e) =>
                setNewLessonTitle((prev) => ({ ...prev, [courseModule.id]: e.target.value }))
              }
              placeholder="Nova aula..."
              className="h-8 text-sm"
            />
            <Button type="submit" size="sm" variant="outline" disabled={isPending}>
              <Plus className="size-3.5" /> Aula
            </Button>
          </form>
        </div>
      ))}

      <form onSubmit={addModule} className="flex gap-2 border-t pt-4">
        <Input
          value={newModuleTitle}
          onChange={(e) => setNewModuleTitle(e.target.value)}
          placeholder="Novo módulo..."
        />
        <Button type="submit" variant="outline" disabled={isPending}>
          <Plus className="size-4" /> Módulo
        </Button>
      </form>
    </div>
  );
}
