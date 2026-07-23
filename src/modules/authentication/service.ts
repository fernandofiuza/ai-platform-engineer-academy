import { randomBytes, createHash } from "node:crypto";

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { hashPassword } from "./password";
import type { RegisterInput } from "./schema";

export class EmailAlreadyInUseError extends Error {
  constructor() {
    super("Este e-mail já está cadastrado.");
    this.name = "EmailAlreadyInUseError";
  }
}

export class InvalidResetTokenError extends Error {
  constructor() {
    super("Link de redefinição inválido ou expirado. Solicite um novo.");
    this.name = "InvalidResetTokenError";
  }
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

function hashToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Gera um token de redefinição e invalida os anteriores do usuário. Não lança erro se o e-mail
 * não existir (evita enumeração de contas) — nesse caso retorna null.
 *
 * Envio real de e-mail exige infraestrutura externa (ver docs/DECISIONS.md — "Reset de senha").
 * Em desenvolvimento, o link é logado via `logger` em vez de enviado por e-mail.
 */
export async function requestPasswordReset(email: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return null;
  }

  await db.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const rawToken = randomBytes(32).toString("hex");
  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/redefinir-senha?token=${rawToken}`;

  if (process.env.NODE_ENV === "production") {
    logger.warn("password reset requested but no e-mail provider is configured", { userId: user.id });
  } else {
    logger.info("password reset link (modo desenvolvimento — nenhum e-mail é enviado)", {
      email,
      resetUrl,
    });
  }

  return { resetUrl };
}

export async function resetPassword(rawToken: string, newPassword: string) {
  const tokenHash = hashToken(rawToken);
  const resetToken = await db.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw new InvalidResetTokenError();
  }

  const passwordHash = await hashPassword(newPassword);

  await db.$transaction([
    db.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    db.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);
}

export async function registerStudent(input: RegisterInput) {
  const existing = await db.user.findUnique({ where: { email: input.email } });

  if (existing) {
    throw new EmailAlreadyInUseError();
  }

  const passwordHash = await hashPassword(input.password);

  const user = await db.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: "STUDENT",
      profile: { create: {} },
    },
  });

  return user;
}
