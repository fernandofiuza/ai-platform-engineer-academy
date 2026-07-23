"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/lib/auth";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "./schema";
import { EmailAlreadyInUseError, registerStudent } from "./service";

type ActionResult = { error: string | null };

export async function loginAction(
  input: LoginInput & { callbackUrl?: string }
): Promise<ActionResult> {
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
