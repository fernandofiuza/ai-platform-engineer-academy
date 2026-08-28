import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/modules/authentication/password";

export class InvalidCurrentPasswordError extends Error {
  constructor() {
    super("Senha atual incorreta.");
    this.name = "InvalidCurrentPasswordError";
  }
}

export async function updateUserName(userId: string, name: string) {
  await db.user.update({ where: { id: userId }, data: { name } });
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });

  const currentPasswordMatches = await verifyPassword(currentPassword, user.passwordHash);
  if (!currentPasswordMatches) {
    throw new InvalidCurrentPasswordError();
  }

  const passwordHash = await hashPassword(newPassword);
  await db.user.update({ where: { id: userId }, data: { passwordHash } });
}
