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

const contentStatus = z.enum(["DRAFT", "PLANNED", "AVAILABLE", "IN_PROGRESS", "COMPLETED", "ARCHIVED"]);

export const saveProjectSchema = z.object({
  projectId: z.string().optional(),
  title: z.string().trim().min(1).max(200),
  problem: z.string().max(2000).optional(),
  context: z.string().max(2000).optional(),
  objective: z.string().max(2000).optional(),
  requirements: z.array(z.string()).default([]),
  optionalRequirements: z.array(z.string()).default([]),
  deliverables: z.array(z.string()).default([]),
  acceptanceCriteria: z.array(z.string()).default([]),
  status: contentStatus,
});

export type SaveProjectInput = z.infer<typeof saveProjectSchema>;
