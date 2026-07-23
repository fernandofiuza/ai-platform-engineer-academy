"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { createNoteAction, updateNoteAction } from "@/modules/notes/actions";
import { NOTE_TEMPLATE_LABELS } from "@/modules/notes/labels";

type LessonOption = { id: string; title: string };

type ExistingNote = {
  id: string;
  title: string;
  contentMarkdown: string;
  template: string;
  tags: string[];
  scopeId: string | null;
};

export function NoteFormDialog({
  lessonOptions,
  existingNote,
  trigger,
}: {
  lessonOptions: LessonOption[];
  existingNote?: ExistingNote;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [title, setTitle] = React.useState(existingNote?.title ?? "");
  const [content, setContent] = React.useState(existingNote?.contentMarkdown ?? "");
  const [template, setTemplate] = React.useState(existingNote?.template ?? "SUMMARY");
  const [tags, setTags] = React.useState(existingNote?.tags.join(", ") ?? "");
  const [lessonId, setLessonId] = React.useState(existingNote?.scopeId ?? "");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    startTransition(async () => {
      const payload = {
        title,
        contentMarkdown: content,
        template: template as
          | "SUMMARY"
          | "QUESTION"
          | "DECISION"
          | "TROUBLESHOOTING"
          | "RETROSPECTIVE"
          | "CONCEPT"
          | "COMMAND",
        tags: parsedTags,
        lessonId: lessonId || undefined,
      };
      const result = existingNote
        ? await updateNoteAction({ noteId: existingNote.id, ...payload })
        : await createNoteAction(payload);

      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(existingNote ? "Anotação atualizada." : "Anotação criada.");
      setOpen(false);
      if (!existingNote) {
        setTitle("");
        setContent("");
        setTags("");
        setLessonId("");
      }
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" /> Nova anotação
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{existingNote ? "Editar anotação" : "Nova anotação"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="note-title">Título</Label>
            <Input id="note-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Modelo</Label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(NOTE_TEMPLATE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Vincular a uma aula (opcional)</Label>
              <Select value={lessonId} onValueChange={setLessonId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  {lessonOptions.map((lesson) => (
                    <SelectItem key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note-tags">Tags (separadas por vírgula)</Label>
            <Input
              id="note-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="docker, troubleshooting"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note-content">Conteúdo (Markdown)</Label>
            <Textarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              required
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
