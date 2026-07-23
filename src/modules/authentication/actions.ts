"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";

import { checkRateLimit } from "@/lib/rate-limit";
import { signIn, signOut } from "@/lib/auth";
import {
  loginSchema,
  registerSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  type LoginInput,
  type RegisterInput,
  type RequestPasswordResetInput,
  type ResetPasswordInput,
} from "./schema";
import {
  EmailAlreadyInUseError,
  InvalidResetTokenError,
  registerStudent,
  requestPasswordReset,
  resetPassword,
} from "./service";

type ActionResult = { error: string | null };

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;
const REGISTER_WINDOW_MS = 60 * 60 * 1000;
const REGISTER_MAX_ATTEMPTS = 5;
const RESET_WINDOW_MS = 60 * 60 * 1000;
const RESET_MAX_ATTEMPTS = 5;

async function getClientIp() {
  const headersList = await headers();
  return headersList.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

export async function loginAction(
  input: LoginInput & { callbackUrl?: string }
): Promise<ActionResult> {
  const ip = await getClientIp();
  const rateLimit = checkRateLimit(`login:${ip}`, {
    windowMs: LOGIN_WINDOW_MS,
    maxRequests: LOGIN_MAX_ATTEMPTS,
  });
  if (!rateLimit.allowed) {
    return {
      error: `Muitas tentativas de login. Tente novamente em ${Math.ceil((rateLimit.retryAfterSeconds ?? 0) / 60)} min.`,
    };
  }

  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return { error: "Dados inválidos. Confira o e-mail e a senha." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: input.callbackUrl && input.callbackUrl.startsWith("/") ? input.callbackUrl : "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "E-mail ou senha incorretos." };
      }
      return { error: "Não foi possível entrar agora. Tente novamente." };
    }
    throw error;
  }

  return { error: null };
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function registerAction(input: RegisterInput): Promise<ActionResult> {
  const ip = await getClientIp();
  const rateLimit = checkRateLimit(`register:${ip}`, {
    windowMs: REGISTER_WINDOW_MS,
    maxRequests: REGISTER_MAX_ATTEMPTS,
  });
  if (!rateLimit.allowed) {
    return {
      error: `Muitas tentativas de cadastro. Tente novamente em ${Math.ceil((rateLimit.retryAfterSeconds ?? 0) / 60)} min.`,
    };
  }

  const parsed = registerSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await registerStudent(parsed.data);
  } catch (error) {
    if (error instanceof EmailAlreadyInUseError) {
      return { error: error.message };
    }
    throw error;
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Conta criada. Faça login para continuar." };
    }
    throw error;
  }

  return { error: null };
}

export async function requestPasswordResetAction(
  input: RequestPasswordResetInput
): Promise<ActionResult & { devResetUrl?: string }> {
  const ip = await getClientIp();
  const rateLimit = checkRateLimit(`reset:${ip}`, {
    windowMs: RESET_WINDOW_MS,
    maxRequests: RESET_MAX_ATTEMPTS,
  });
  if (!rateLimit.allowed) {
    return {
      error: `Muitas solicitações. Tente novamente em ${Math.ceil((rateLimit.retryAfterSeconds ?? 0) / 60)} min.`,
    };
  }

  const parsed = requestPasswordResetSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Informe um e-mail válido." };
  }

  const result = await requestPasswordReset(parsed.data.email);

  // Mesma resposta exista ou não o e-mail, para não revelar quais contas existem.
  return {
    error: null,
    devResetUrl: process.env.NODE_ENV !== "production" ? result?.resetUrl : undefined,
  };
}

export async function resetPasswordAction(input: ResetPasswordInput): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await resetPassword(parsed.data.token, parsed.data.password);
  } catch (error) {
    if (error instanceof InvalidResetTokenError) {
      return { error: error.message };
    }
    throw error;
  }

  return { error: null };
}
