import { NotebookPen } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NoteCard } from "@/modules/notes/components/note-card";
import { NoteFormDialog } from "@/modules/notes/components/note-form-dialog";

type ExternalLessonNote = {
  id: string;
  title: string;
  contentMarkdown: string;
  template: string;
  tags: string[];
  isFavorite: boolean;
  scopeId: string | null;
  updatedAt: Date;
};

export function ExternalLessonNotesPanel({
  externalLessonId,
  notes,
}: {
  externalLessonId: string;
  notes: ExternalLessonNote[];
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <NotebookPen className="size-4" /> Anotações desta aula
          </CardTitle>
          <CardDescription>
            Links, comandos, dúvidas — qualquer coisa que você queira guardar sobre esta aula.
          </CardDescription>
        </div>
        <NoteFormDialog fixedExternalLessonId={externalLessonId} />
      </CardHeader>
      {notes.length > 0 ? (
        <CardContent className="space-y-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} fixedExternalLessonId={externalLessonId} />
          ))}
        </CardContent>
      ) : null}
    </Card>
  );
}
