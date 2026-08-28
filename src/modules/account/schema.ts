import { z } from "zod";

export const updateNameSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo."),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe sua senha atual."),
    newPassword: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres.")
      .regex(/[a-z]/, "A senha deve conter ao menos uma letra minúscula.")
      .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiúscula.")
      .regex(/[0-9]/, "A senha deve conter ao menos um número."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type UpdateNameInput = z.infer<typeof updateNameSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
