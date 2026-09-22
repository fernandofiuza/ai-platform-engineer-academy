"use client";

import * as React from "react";
import { FileText, Image as ImageIcon, Loader2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteNoteAttachmentAction } from "@/modules/notes/actions";
import { formatFileSize } from "@/modules/notes/attachments";

export type Attachment = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
};

function AttachmentIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <ImageIcon className="size-4 shrink-0" />;
  if (mimeType === "application/pdf") return <FileText className="size-4 shrink-0" />;
  return <Paperclip className="size-4 shrink-0" />;
}

/** Lista de anexos de uma anotação. `onRemoved` só é chamado quando `removable` — usado pelo
 * formulário de edição, que mantém sua própria cópia local da lista para atualizar a UI na hora
 * sem esperar um `router.refresh()`. Na visualização (NoteCard), a lista é só leitura. */
export function AttachmentList({
  attachments,
  removable = false,
  onRemoved,
}: {
  attachments: Attachment[];
  removable?: boolean;
  onRemoved?: (attachmentId: string) => void;
}) {
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  if (attachments.length === 0) return null;

  function onRemove(attachmentId: string) {
    setPendingId(attachmentId);
    deleteNoteAttachmentAction(attachmentId)
      .then((result) => {
        if (result?.error) {
          toast.error(result.error);
          return;
        }
        onRemoved?.(attachmentId);
      })
      .finally(() => setPendingId(null));
  }

  return (
    <ul className="space-y-1.5">
      {attachments.map((attachment) => (
        <li
          key={attachment.id}
          className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-sm"
        >
          <AttachmentIcon mimeType={attachment.mimeType} />
          <a
            href={`/api/notes/attachments/${attachment.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate hover:underline"
          >
            {attachment.originalName}
          </a>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatFileSize(attachment.size)}
          </span>
          {removable ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`Remover ${attachment.originalName}`}
              disabled={pendingId === attachment.id}
              onClick={() => onRemove(attachment.id)}
            >
              {pendingId === attachment.id ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <X className="size-3" />
              )}
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
