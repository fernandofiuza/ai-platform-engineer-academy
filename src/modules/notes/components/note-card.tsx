"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Star, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";
import { deleteNoteAction, toggleFavoriteAction } from "@/modules/notes/actions";
import { NOTE_TEMPLATE_LABELS } from "@/modules/notes/labels";
import { AttachmentList, type Attachment } from "./attachment-list";
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
  topics?: { topic: { id: string; name: string } }[];
  attachments?: Attachment[];
};

export function NoteCard({
  note,
  fixedLessonId,
  fixedExternalLessonId,
  fixedWeekId,
  availableTopics,
  weekOptions,
}: {
  note: Note;
  fixedLessonId?: string;
  fixedExternalLessonId?: string;
  fixedWeekId?: string;
  availableTopics?: { id: string; name: string }[];
  weekOptions?: { id: string; number: number; title: string }[];
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
            // O Dialog não remonta sozinho entre abrir/fechar, então os `useState` internos do
            // formulário só capturariam `existingNote` na primeira renderização — sem essa key,
            // anexos/temas adicionados numa sessão anterior do form (que dispara
            // `router.refresh()`) não apareceriam ao reabrir editar a mesma nota. Trocar a key
            // força remontar com os dados mais recentes sempre que eles mudam de verdade.
            key={`${note.id}:${note.attachments?.length ?? 0}:${note.topics?.length ?? 0}`}
            existingNote={{
              ...note,
              topicIds: note.topics?.map((t) => t.topic.id) ?? [],
              attachments: note.attachments ?? [],
            }}
            fixedLessonId={fixedLessonId}
            fixedExternalLessonId={fixedExternalLessonId}
            fixedWeekId={fixedWeekId}
            availableTopics={availableTopics}
            weekOptions={weekOptions}
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
        {note.topics && note.topics.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {note.topics.map(({ topic }) => (
              <Badge key={topic.id}>
                <Tag className="size-3" /> {topic.name}
              </Badge>
            ))}
          </div>
        ) : null}
        {note.tags.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {note.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
        {note.attachments && note.attachments.length > 0 ? (
          <div className="mt-3">
            <AttachmentList attachments={note.attachments} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
