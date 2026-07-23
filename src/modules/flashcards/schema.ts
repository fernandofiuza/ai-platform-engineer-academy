import { z } from "zod";

export const reviewFlashcardSchema = z.object({
  flashcardId: z.string().min(1),
  quality: z.number().int().min(0).max(5),
});

export type ReviewFlashcardInput = z.infer<typeof reviewFlashcardSchema>;
