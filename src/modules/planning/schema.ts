import { z } from "zod";

export const studyPlanSchema = z.object({
  availableDays: z.array(z.number().int().min(0).max(6)).min(1, "Selecione ao menos um dia."),
  dailyHours: z.number().min(0.5).max(12),
  preferredTime: z.string().max(50).optional(),
  // Sem coerce: o form sempre entrega um Date real (via setValue), e Server Actions
  // preservam o tipo Date ao serializar — coerce quebraria a inferência de tipos do
  // react-hook-form (input vs output do zod ficam diferentes).
  startDate: z.date(),
  notes: z.string().max(2000).optional(),
});

export const createGoalSchema = z.object({
  title: z.string().trim().min(2, "Informe um título."),
  targetDate: z.coerce.date().optional(),
  relatedWeekId: z.string().optional(),
});

export const rescheduleGoalSchema = z.object({
  goalId: z.string().min(1),
  targetDate: z.coerce.date(),
});

export type StudyPlanInput = z.infer<typeof studyPlanSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type RescheduleGoalInput = z.infer<typeof rescheduleGoalSchema>;
