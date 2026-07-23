import { z } from "zod";

const noteTemplates = [
  "SUMMARY",
  "QUESTION",
  "DECISION",
  "TROUBLESHOOTING",
  "RETROSPECTIVE",
  "CONCEPT",
  "COMMAND",
] as const;

export const createNoteSchema = z.object({
  title: z.string().trim().min(2, "Informe um título."),
  contentMarkdown: z.string().trim().min(1, "O conteúdo não pode ficar vazio."),
  template: z.enum(noteTemplates),
  tags: z.array(z.string()).default([]),
  lessonId: z.string().optional(),
});

export const updateNoteSchema = createNoteSchema.extend({
  noteId: z.string().min(1),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
