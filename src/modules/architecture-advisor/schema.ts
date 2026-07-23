import { z } from "zod";

export const requestArchitectureSchema = z.object({
  problem: z.string().trim().min(10).max(2000),
});

export type RequestArchitectureInput = z.infer<typeof requestArchitectureSchema>;
