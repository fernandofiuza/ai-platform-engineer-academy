import { z } from "zod";

export const addPortfolioItemSchema = z.object({
  repoUrl: z.url("Informe uma URL válida."),
  projectId: z.string().optional(),
});

export const updateChecklistSchema = z.object({
  itemId: z.string().min(1),
  checklist: z.record(z.string(), z.boolean()),
});

export type AddPortfolioItemInput = z.infer<typeof addPortfolioItemSchema>;
export type UpdateChecklistInput = z.infer<typeof updateChecklistSchema>;
