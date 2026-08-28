"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { updateProfileSchema, type UpdateProfileInput } from "./schema";
import { updateProfile } from "./service";

type ActionResult = { error: string | null };

export async function updateProfileAction(input: UpdateProfileInput): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await updateProfile(session.user.id, parsed.data);

  revalidatePath("/profile");
  return { error: null };
}
