import { db } from "@/lib/db";
import { hashPassword } from "./password";
import type { RegisterInput } from "./schema";

export class EmailAlreadyInUseError extends Error {
  constructor() {
    super("Este e-mail já está cadastrado.");
    this.name = "EmailAlreadyInUseError";
  }
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
