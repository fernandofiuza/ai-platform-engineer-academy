import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export function hashPassword(plainPassword: string) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export function verifyPassword(plainPassword: string, passwordHash: string) {
  return bcrypt.compare(plainPassword, passwordHash);
}
