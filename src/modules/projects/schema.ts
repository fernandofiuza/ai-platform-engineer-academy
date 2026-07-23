import { z } from "zod";

export const saveSubmissionSchema = z.object({
  projectId: z.string().min(1),
  repoUrl: z.union([z.url(), z.literal("")]).optional(),
  deployUrl: z.union([z.url(), z.literal("")]).optional(),
  decisions: z.string().max(4000).optional(),
  retrospective: z.string().max(4000).optional(),
  status: z.enum(["OPEN", "DONE", "CANCELLED"]),
});

export type SaveSubmissionInput = z.infer<typeof saveSubmissionSchema>;
