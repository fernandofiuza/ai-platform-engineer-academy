"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";
import { deleteNoteAction, toggleFavoriteAction } from "@/modules/notes/actions";
import { NOTE_TEMPLATE_LABELS } from "@/modules/notes/labels";
import { NoteFormDialog } from "./note-form-dialog";

type Note = {
  id: string;
  title: string;
  contentMarkdown: string;
  template: string;
  tags: string[];
  isFavorite: boolean;
  scopeId: string | null;
  updatedAt: Date;
};

export function NoteCard({
  note,
  lessonOptions,
  fixedLessonId,
}: {
  note: Note;
  lessonOptions: { id: string; title: string }[];
  fixedLessonId?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function onToggleFavorite() {
    startTransition(async () => {
      const result = await toggleFavoriteAction(note.id);
      if (result?.error) toast.error(result.error);
      router.refresh();
    });
  }

  function onDelete() {
    startTransition(async () => {
      const result = await deleteNoteAction(note.id);
      if (result?.error) toast.error(result.error);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{note.title}</h3>
            <Badge variant="secondary">{NOTE_TEMPLATE_LABELS[note.template]}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Atualizada em {note.updatedAt.toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Favoritar"
            onClick={onToggleFavorite}
            disabled={isPending}
          >
            <Star className={cn("size-4", note.isFavorite && "fill-primary text-primary")} />
          </Button>
          <NoteFormDialog
            lessonOptions={lessonOptions}
            existingNote={note}
            fixedLessonId={fixedLessonId}
            trigger={
              <Button variant="ghost" size="sm">
                Editar
              </Button>
            }
          />
          <Button variant="ghost" size="icon-sm" aria-label="Excluir" onClick={onDelete} disabled={isPending}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Markdown content={note.contentMarkdown} />
        {note.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {note.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
