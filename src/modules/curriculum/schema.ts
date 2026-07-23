import { z } from "zod";

export const checklistItemUpdateSchema = z.object({
  checklistItemId: z.string().min(1),
  done: z.boolean(),
  note: z.string().max(2000).optional(),
  evidenceUrl: z.union([z.url(), z.literal("")]).optional(),
  installedVersion: z.string().max(200).optional(),
  reviewNeeded: z.boolean().optional(),
});

export const completeLessonSchema = z.object({
  lessonId: z.string().min(1),
  confidence: z.number().int().min(1).max(5),
  whatLearned: z.string().max(4000).optional(),
  whatUnclear: z.string().max(4000).optional(),
});

export type ChecklistItemUpdateInput = z.infer<typeof checklistItemUpdateSchema>;
export type CompleteLessonInput = z.infer<typeof completeLessonSchema>;
