import { z } from "zod";

export const completeLaboratorySchema = z.object({
  laboratoryId: z.string().min(1),
  evidenceUrl: z.union([z.url(), z.literal("")]).optional(),
  notes: z.string().max(2000).optional(),
});

export type CompleteLaboratoryInput = z.infer<typeof completeLaboratorySchema>;
