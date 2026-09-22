"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, RefreshCw, StickyNote, Trash2 } from "lucide-react";
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
  completedAt: Date | string | null;
  markedForReview: boolean;
  noteCount?: number;
};

function formatCompletedAt(completedAt: Date | string) {
  const date = new Date(completedAt);
  const day = date.toLocaleDateString("pt-BR");
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${day} às ${time}`;
}

type Module = {
  id: string;
  title: string;
  lessons: Lesson[];
  /** Submódulos — espelha a hierarquia de pastas de uma importação por pasta local. */
  modules: Module[];
};

function LessonRow({ courseId, lesson }: { courseId: string; lesson: Lesson }) {
  const router = useRouter();
  const [optimistic, setOptimistic] = React.useState<boolean | null>(null);
  const [isPending, setIsPending] = React.useState(false);
  const completed = optimistic ?? lesson.completed;

  async function toggle() {
    setOptimistic(!completed);
    setIsPending(true);
    const result = await toggleExternalLessonCompletionAction(lesson.id);
    setIsPending(false);
    if (result?.error) {
      toast.error(result.error);
      setOptimistic(lesson.completed);
      return;
    }
    router.refresh();
  }

  function remove() {
    if (!window.confirm(`Excluir a aula "${lesson.title}"?`)) return;
    setIsPending(true);
    void deleteExternalLessonAction(lesson.id).then((result) => {
      setIsPending(false);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <Checkbox
        checked={completed}
        onCheckedChange={() => void toggle()}
        aria-label={`Marcar "${lesson.title}" como concluída`}
      />
      {completed && lesson.completedAt ? (
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatCompletedAt(lesson.completedAt)}
        </span>
      ) : null}
      <Link
        href={`/study-hub/courses/${courseId}/lessons/${lesson.id}`}
        className={cn("flex-1 text-sm hover:underline", completed && "text-muted-foreground line-through")}
      >
        {lesson.title}
      </Link>
      {lesson.noteCount ? (
        <span
          className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground"
          title={lesson.noteCount === 1 ? "1 anotação" : `${lesson.noteCount} anotações`}
        >
          <StickyNote className="size-3.5" />
          {lesson.noteCount}
        </span>
      ) : null}
      {lesson.markedForReview ? (
        <Badge variant="outline" className="gap-1">
          <RefreshCw className="size-3" /> revisar
        </Badge>
      ) : null}
      {isPending ? <Loader2 className="size-3.5 animate-spin text-muted-foreground" /> : null}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Excluir aula "${lesson.title}"`}
        onClick={remove}
      >
        <Trash2 className="size-3.5 text-muted-foreground" />
      </Button>
    </div>
  );
}

function ModuleNode({
  courseId,
  courseModule,
  depth,
}: {
  courseId: string;
  courseModule: Module;
  depth: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [newLessonTitle, setNewLessonTitle] = React.useState("");
  const [newSubmoduleTitle, setNewSubmoduleTitle] = React.useState("");
  const [showSubmoduleForm, setShowSubmoduleForm] = React.useState(false);

  function addLesson(e: React.FormEvent) {
    e.preventDefault();
    const title = newLessonTitle.trim();
    if (!title) return;
    startTransition(async () => {
      const result = await createExternalLessonAction({ moduleId: courseModule.id, title });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setNewLessonTitle("");
      router.refresh();
    });
  }

  function addSubmodule(e: React.FormEvent) {
    e.preventDefault();
    const title = newSubmoduleTitle.trim();
    if (!title) return;
    startTransition(async () => {
      const result = await createExternalModuleAction({
        courseId,
        title,
        parentModuleId: courseModule.id,
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setNewSubmoduleTitle("");
      setShowSubmoduleForm(false);
      router.refresh();
    });
  }

  function removeModule() {
    if (!window.confirm(`Excluir o módulo "${courseModule.title}" e tudo dentro dele?`)) return;
    startTransition(async () => {
      const result = await deleteExternalModuleAction(courseModule.id);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div style={depth > 0 ? { marginLeft: 20 } : undefined} className={depth > 0 ? "border-l pl-4" : undefined}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{courseModule.title}</h3>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Excluir módulo "${courseModule.title}"`}
          onClick={removeModule}
        >
          <Trash2 className="size-3.5 text-muted-foreground" />
        </Button>
      </div>

      {courseModule.lessons.length > 0 ? (
        <div className="mt-2 divide-y rounded-lg border">
          {courseModule.lessons.map((lesson) => (
            <LessonRow key={lesson.id} courseId={courseId} lesson={lesson} />
          ))}
        </div>
      ) : null}

      <form className="mt-2 flex gap-2" onSubmit={addLesson}>
        <Input
          value={newLessonTitle}
          onChange={(e) => setNewLessonTitle(e.target.value)}
          placeholder="Nova aula..."
          className="h-8 text-sm"
        />
        <Button type="submit" size="sm" variant="outline" disabled={isPending}>
          <Plus className="size-3.5" /> Aula
        </Button>
      </form>

      {courseModule.modules.length > 0 ? (
        <div className="mt-4 space-y-4">
          {courseModule.modules.map((child) => (
            <ModuleNode key={child.id} courseId={courseId} courseModule={child} depth={depth + 1} />
          ))}
        </div>
      ) : null}

      {showSubmoduleForm ? (
        <form className="mt-2 flex gap-2" style={{ marginLeft: 20 }} onSubmit={addSubmodule}>
          <Input
            value={newSubmoduleTitle}
            onChange={(e) => setNewSubmoduleTitle(e.target.value)}
            placeholder="Novo submódulo..."
            className="h-8 text-sm"
            autoFocus
          />
          <Button type="submit" size="sm" variant="outline" disabled={isPending}>
            <Plus className="size-3.5" /> Submódulo
          </Button>
        </form>
      ) : (
        <button
          type="button"
          className="mt-2 text-xs text-muted-foreground hover:text-foreground hover:underline"
          style={{ marginLeft: 20 }}
          onClick={() => setShowSubmoduleForm(true)}
        >
          + Adicionar submódulo
        </button>
      )}
    </div>
  );
}

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
  const [isPending, startTransition] = React.useTransition();
  const [newModuleTitle, setNewModuleTitle] = React.useState("");

  function addModule(e: React.FormEvent) {
    e.preventDefault();
    const title = newModuleTitle.trim();
    if (!title) return;
    startTransition(async () => {
      const result = await createExternalModuleAction({ courseId, title });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setNewModuleTitle("");
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

      <div className="space-y-6">
        {modules.map((courseModule) => (
          <ModuleNode key={courseModule.id} courseId={courseId} courseModule={courseModule} depth={0} />
        ))}
      </div>

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
