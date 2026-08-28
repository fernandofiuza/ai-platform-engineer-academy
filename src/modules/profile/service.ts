import { db } from "@/lib/db";
import type { UpdateProfileInput } from "./schema";

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  await db.profile.upsert({
    where: { userId },
    update: { bio: input.bio || null, timezone: input.timezone },
    create: { userId, bio: input.bio || null, timezone: input.timezone },
  });
}
