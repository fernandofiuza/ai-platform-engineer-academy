import { NotebookPen } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NoteCard } from "./note-card";
import { NoteFormDialog } from "./note-form-dialog";

type LessonNote = {
  id: string;
  title: string;
  contentMarkdown: string;
  template: string;
  tags: string[];
  isFavorite: boolean;
  scopeId: string | null;
  updatedAt: Date;
};

export function LessonNotesPanel({
  lessonId,
  lessonTitle,
  notes,
}: {
  lessonId: string;
  lessonTitle: string;
  notes: LessonNote[];
}) {
  const lessonOptions = [{ id: lessonId, title: lessonTitle }];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <NotebookPen className="size-4" /> Anotações desta aula
          </CardTitle>
          <CardDescription>
            Links, comandos, dúvidas, checklist — qualquer coisa que você queira guardar sobre
            este dia de estudo.
          </CardDescription>
        </div>
        <NoteFormDialog lessonOptions={lessonOptions} fixedLessonId={lessonId} />
      </CardHeader>
      {notes.length > 0 ? (
        <CardContent className="space-y-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} lessonOptions={lessonOptions} fixedLessonId={lessonId} />
          ))}
        </CardContent>
      ) : null}
    </Card>
  );
}
