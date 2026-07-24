import { db } from "@/lib/db";

export async function getNotes(
  userId: string,
  filters: { search?: string; tag?: string; favoriteOnly?: boolean } = {}
) {
  return db.note.findMany({
    where: {
      userId,
      ...(filters.favoriteOnly ? { isFavorite: true } : {}),
      ...(filters.tag ? { tags: { has: filters.tag } } : {}),
      ...(filters.search
        ? {
            OR: [
              { title: { contains: filters.search, mode: "insensitive" } },
              { contentMarkdown: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getNotesForLesson(userId: string, lessonId: string) {
  return db.note.findMany({
    where: { userId, scopeType: "LESSON", scopeId: lessonId },
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getAllTagsForUser(userId: string) {
  const notes = await db.note.findMany({ where: { userId }, select: { tags: true } });
  const tagSet = new Set<string>();
  for (const note of notes) {
    for (const tag of note.tags) tagSet.add(tag);
  }
  return [...tagSet].sort();
}
