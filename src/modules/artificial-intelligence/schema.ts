import { z } from "zod";
import { MAX_INPUT_LENGTH } from "./types";

export const askQuestionSchema = z.object({
  question: z.string().trim().min(1).max(MAX_INPUT_LENGTH),
  lessonId: z.string().optional(),
});

export const summarizeLessonSchema = z.object({
  lessonId: z.string().min(1),
});

export const generateQuizSchema = z.object({
  lessonId: z.string().min(1),
});

export const explainConceptSchema = z.object({
  lessonId: z.string().min(1),
  question: z.string().trim().max(MAX_INPUT_LENGTH).optional(),
});

export type AskQuestionInput = z.infer<typeof askQuestionSchema>;
export type SummarizeLessonInput = z.infer<typeof summarizeLessonSchema>;
export type GenerateQuizInput = z.infer<typeof generateQuizSchema>;
export type ExplainConceptInput = z.infer<typeof explainConceptSchema>;
