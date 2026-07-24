import { z } from "zod";

const contentStatus = z.enum(["DRAFT", "PLANNED", "AVAILABLE", "IN_PROGRESS", "COMPLETED", "ARCHIVED"]);

export const updateWeekSchema = z.object({
  weekId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  objective: z.string().max(2000).optional(),
  status: contentStatus,
});

export const saveLessonSchema = z.object({
  lessonId: z.string().optional(),
  weekId: z.string().min(1),
  order: z.number().int().min(0),
  title: z.string().trim().min(1).max(200),
  objective: z.string().max(2000).optional(),
  durationMinutes: z.number().int().min(0).max(600).optional(),
  contentMarkdown: z.string().max(20000).optional(),
  status: contentStatus,
});

export const addFlashcardSchema = z.object({
  lessonId: z.string().min(1),
  question: z.string().trim().min(1).max(500),
  answer: z.string().trim().min(1).max(1000),
  tags: z.array(z.string()).default([]),
});

export const addQuestionSchema = z.object({
  lessonId: z.string().min(1),
  prompt: z.string().trim().min(1).max(500),
  explanation: z.string().max(1000).optional(),
  options: z
    .array(z.object({ text: z.string().trim().min(1).max(300), isCorrect: z.boolean() }))
    .min(2)
    .max(6)
    .refine((opts) => opts.some((o) => o.isCorrect), "Marque ao menos uma opção correta."),
});

export const saveMilestoneSchema = z.object({
  weekId: z.string().min(1),
  track: z.enum(["PRODUCT", "PROFESSIONAL"]),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: contentStatus,
});

export type UpdateWeekInput = z.infer<typeof updateWeekSchema>;
export type SaveLessonInput = z.infer<typeof saveLessonSchema>;
export type AddFlashcardInput = z.infer<typeof addFlashcardSchema>;
export type AddQuestionInput = z.infer<typeof addQuestionSchema>;
export type SaveMilestoneInput = z.infer<typeof saveMilestoneSchema>;
