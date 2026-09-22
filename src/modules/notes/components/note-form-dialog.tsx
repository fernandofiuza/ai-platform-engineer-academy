"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Paperclip, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { createNoteAction, updateNoteAction, uploadNoteAttachmentAction } from "@/modules/notes/actions";
import { formatFileSize, validateAttachment } from "@/modules/notes/attachments";
import { NOTE_TEMPLATE_LABELS } from "@/modules/notes/labels";
import { AttachmentList, type Attachment } from "./attachment-list";

type ExistingNote = {
  id: string;
  title: string;
  contentMarkdown: string;
  template: string;
  tags: string[];
  scopeId: string | null;
  topicIds?: string[];
  attachments?: Attachment[];
};

const ATTACHMENT_ACCEPT = ".jpg,.jpeg,.png,.webp,.pdf,.txt,.md";

export function NoteFormDialog({
  existingNote,
  trigger,
  fixedLessonId,
  fixedExternalLessonId,
  fixedWeekId,
  availableTopics = [],
  weekOptions = [],
}: {
  existingNote?: ExistingNote;
  trigger?: React.ReactNode;
  /** Anotações de aula só nascem vinculadas via a tela da própria aula — nunca por um seletor
   * na tela geral de Anotações. Quando informado, a anotação já nasce/permanece vinculada a essa
   * aula, sem nenhum campo de vínculo visível no formulário. */
  fixedLessonId?: string;
  /** Mesmo padrão de `fixedLessonId`, para anotações de aulas de cursos externos (Study Hub). */
  fixedExternalLessonId?: string;
  /** Mesmo padrão de `fixedLessonId`, para anotações abertas a partir de uma semana do Roadmap. */
  fixedWeekId?: string;
  /** Temas/subtemas disponíveis para vínculo (lista de `Topic`) — independente de
   * lesson/externalLesson/week, sempre editável quando informada. */
  availableTopics?: { id: string; name: string }[];
  /** Semanas disponíveis para vínculo manual, quando não há `fixedWeekId`. */
  weekOptions?: { id: string; number: number; title: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [title, setTitle] = React.useState(existingNote?.title ?? "");
  const [content, setContent] = React.useState(existingNote?.contentMarkdown ?? "");
  const [template, setTemplate] = React.useState(existingNote?.template ?? "SUMMARY");
  const [tags, setTags] = React.useState(existingNote?.tags.join(", ") ?? "");
  const [weekId, setWeekId] = React.useState(fixedWeekId ?? existingNote?.scopeId ?? "");
  const [topicIds, setTopicIds] = React.useState<string[]>(existingNote?.topicIds ?? []);
  const [topicFilter, setTopicFilter] = React.useState("");
  const [existingAttachments, setExistingAttachments] = React.useState<Attachment[]>(
    existingNote?.attachments ?? []
  );
  const [pendingFiles, setPendingFiles] = React.useState<File[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const lessonId = fixedLessonId ?? "";
  const externalLessonId = fixedExternalLessonId ?? "";
  const canPickWeek = !fixedLessonId && !fixedExternalLessonId && !fixedWeekId;

  const filteredTopics = topicFilter
    ? availableTopics.filter((t) => t.name.toLowerCase().includes(topicFilter.toLowerCase()))
    : availableTopics;

  function toggleTopic(topicId: string) {
    setTopicIds((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    );
  }

  function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])];
    e.target.value = "";
    for (const file of files) {
      const result = validateAttachment(file);
      if (!result.ok) {
        toast.error(`${file.name}: ${result.error}`);
        continue;
      }
      setPendingFiles((prev) => [...prev, file]);
    }
  }

  function removePendingFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadPendingFiles(noteId: string) {
    if (pendingFiles.length === 0) return;
    setIsUploading(true);
    try {
      for (const file of pendingFiles) {
        const formData = new FormData();
        formData.set("noteId", noteId);
        formData.set("file", file);
        const result = await uploadNoteAttachmentAction(formData);
        if (result?.error) {
          toast.error(`${file.name}: ${result.error}`);
        }
      }
    } finally {
      setIsUploading(false);
    }
  }

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
        externalLessonId: externalLessonId || undefined,
        weekId: (fixedWeekId ?? weekId) || undefined,
        topicIds,
      };
      let noteId: string | undefined = existingNote?.id;
      if (existingNote) {
        const result = await updateNoteAction({ noteId: existingNote.id, ...payload });
        if (result?.error) {
          toast.error(result.error);
          return;
        }
      } else {
        const result = await createNoteAction(payload);
        if (result?.error) {
          toast.error(result.error);
          return;
        }
        noteId = result.noteId;
      }

      if (noteId) await uploadPendingFiles(noteId);

      toast.success(existingNote ? "Anotação atualizada." : "Anotação criada.");
      setOpen(false);
      if (!existingNote) {
        setTitle("");
        setContent("");
        setTags("");
        setWeekId("");
        setTopicIds([]);
      }
      setPendingFiles([]);
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

          {canPickWeek && weekOptions.length > 0 ? (
            <div className="space-y-1.5">
              <Label>Semana (opcional)</Label>
              <Select value={weekId || "NONE"} onValueChange={(v) => setWeekId(v === "NONE" ? "" : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Nenhuma semana vinculada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Nenhuma semana vinculada</SelectItem>
                  {weekOptions.map((week) => (
                    <SelectItem key={week.id} value={week.id}>
                      Semana {week.number} — {week.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {availableTopics.length > 0 ? (
            <div className="space-y-1.5">
              <Label>Temas/subtemas (opcional)</Label>
              {topicIds.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {topicIds.map((id) => {
                    const topic = availableTopics.find((t) => t.id === id);
                    if (!topic) return null;
                    return (
                      <Badge key={id} className="cursor-pointer" onClick={() => toggleTopic(id)}>
                        {topic.name} ×
                      </Badge>
                    );
                  })}
                </div>
              ) : null}
              <div className="relative">
                <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={topicFilter}
                  onChange={(e) => setTopicFilter(e.target.value)}
                  placeholder="Buscar tema..."
                  className="h-8 pl-7 text-sm"
                />
              </div>
              <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                {filteredTopics.length === 0 ? (
                  <p className="px-1 py-1 text-xs text-muted-foreground">Nenhum tema encontrado.</p>
                ) : (
                  filteredTopics.map((topic) => (
                    <label
                      key={topic.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-muted"
                    >
                      <Checkbox
                        checked={topicIds.includes(topic.id)}
                        onCheckedChange={() => toggleTopic(topic.id)}
                      />
                      {topic.name}
                    </label>
                  ))
                )}
              </div>
            </div>
          ) : null}

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

          <div className="space-y-1.5">
            <Label>Anexos (opcional)</Label>
            <AttachmentList
              attachments={existingAttachments}
              removable
              onRemoved={(id) => setExistingAttachments((prev) => prev.filter((a) => a.id !== id))}
            />
            {pendingFiles.length > 0 ? (
              <ul className="space-y-1.5">
                {pendingFiles.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-2 rounded-md border border-dashed border-border px-2.5 py-1.5 text-sm"
                  >
                    <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{file.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Remover ${file.name}`}
                      onClick={() => removePendingFile(index)}
                    >
                      <X className="size-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ATTACHMENT_ACCEPT}
              onChange={onFilesSelected}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="size-3.5" /> Anexar arquivo
            </Button>
            <p className="text-xs text-muted-foreground">
              Imagem (jpg, png, webp), PDF ou texto/markdown — até 10MB por arquivo.
            </p>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending || isUploading}>
              {isPending || isUploading ? <Loader2 className="size-4 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
