import { z } from "zod";

export const updateProfileSchema = z.object({
  bio: z.string().trim().max(500, "A bio deve ter no máximo 500 caracteres.").optional(),
  timezone: z.string().trim().min(1, "Informe um fuso horário."),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
