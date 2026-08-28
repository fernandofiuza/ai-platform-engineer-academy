"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import {
  changePasswordSchema,
  updateNameSchema,
  type ChangePasswordInput,
  type UpdateNameInput,
} from "./schema";
import { InvalidCurrentPasswordError, changeUserPassword, updateUserName } from "./service";

type ActionResult = { error: string | null };

export async function updateNameAction(input: UpdateNameInput): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const parsed = updateNameSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await updateUserName(session.user.id, parsed.data.name);

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { error: null };
}

export async function changePasswordAction(input: ChangePasswordInput): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await changeUserPassword(session.user.id, parsed.data.currentPassword, parsed.data.newPassword);
  } catch (error) {
    if (error instanceof InvalidCurrentPasswordError) {
      return { error: error.message };
    }
    throw error;
  }

  return { error: null };
}
