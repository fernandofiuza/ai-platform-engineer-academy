import { z } from "zod";

export const completeLaboratorySchema = z.object({
  laboratoryId: z.string().min(1),
  evidenceUrl: z.union([z.url(), z.literal("")]).optional(),
  notes: z.string().max(2000).optional(),
});

export type CompleteLaboratoryInput = z.infer<typeof completeLaboratorySchema>;

const contentStatus = z.enum(["DRAFT", "PLANNED", "AVAILABLE", "IN_PROGRESS", "COMPLETED", "ARCHIVED"]);

export const saveLaboratorySchema = z.object({
  laboratoryId: z.string().optional(),
  lessonId: z.string().optional(),
  title: z.string().trim().min(1).max(200),
  objective: z.string().max(2000).optional(),
  environment: z.string().max(1000).optional(),
  prerequisites: z.array(z.string()).default([]),
  instructions: z.string().max(4000).optional(),
  commands: z.string().max(4000).optional(),
  expectedResult: z.string().max(2000).optional(),
  validation: z.string().max(2000).optional(),
  troubleshooting: z.string().max(2000).optional(),
  status: contentStatus,
});

export type SaveLaboratoryInput = z.infer<typeof saveLaboratorySchema>;
