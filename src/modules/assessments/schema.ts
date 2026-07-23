import { z } from "zod";

export const submitAttemptSchema = z.object({
  assessmentId: z.string().min(1),
  answers: z.record(z.string(), z.string()),
  timeSpentSeconds: z.number().int().min(0).optional(),
});

export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
