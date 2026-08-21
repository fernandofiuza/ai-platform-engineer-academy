import { z } from "zod";

export const startSessionSchema = z
  .object({
    lessonId: z.string().optional(),
    externalLessonId: z.string().optional(),
  })
  .refine((data) => !(data.lessonId && data.externalLessonId), {
    message: "Uma sessão só pode estar vinculada a uma aula por vez.",
  });

export const finishSessionSchema = z.object({
  sessionId: z.string().min(1),
  focusRating: z.number().int().min(1).max(5).optional(),
  difficultyRating: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(2000).optional(),
  completedContent: z.boolean().optional(),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type FinishSessionInput = z.infer<typeof finishSessionSchema>;
