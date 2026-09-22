import { db } from "@/lib/db";

const withTopics = {
  topics: { include: { topic: true } },
  attachments: { orderBy: { createdAt: "asc" } },
} as const;

/** Só anotações gerais (`scopeType = GENERAL`) — anotações de aula têm sua própria tela
 * (`getNotesForLesson`, embutida em `/learn/[lessonId]`) e não aparecem aqui. Uma anotação geral
 * pode ainda assim estar vinculada a um ou mais temas (`topicId`), daí o filtro `topicId`. */
export async function getNotes(
  userId: string,
  filters: { search?: string; tag?: string; favoriteOnly?: boolean; topicId?: string } = {}
) {
  return db.note.findMany({
    where: {
      userId,
      scopeType: "GENERAL",
      ...(filters.favoriteOnly ? { isFavorite: true } : {}),
      ...(filters.tag ? { tags: { has: filters.tag } } : {}),
      ...(filters.topicId ? { topics: { some: { topicId: filters.topicId } } } : {}),
      ...(filters.search
        ? {
            OR: [
              { title: { contains: filters.search, mode: "insensitive" } },
              { contentMarkdown: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: withTopics,
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getNotesForLesson(userId: string, lessonId: string) {
  return db.note.findMany({
    where: { userId, scopeType: "LESSON", scopeId: lessonId },
    include: withTopics,
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getNotesForExternalLesson(userId: string, externalLessonId: string) {
  return db.note.findMany({
    where: { userId, scopeType: "EXTERNAL_LESSON", scopeId: externalLessonId },
    include: withTopics,
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getNotesForWeek(userId: string, weekId: string) {
  return db.note.findMany({
    where: { userId, scopeType: "WEEK", scopeId: weekId },
    include: withTopics,
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
  });
}

/** Contagem de anotações por `scopeId`, para um `scopeType` e um conjunto de ids de uma vez —
 * usada pra sinalizar "tem anotação" em listagens/árvores (Study Hub, Roadmap) sem N+1 query por
 * aula/semana. Devolve só os ids com pelo menos 1 anotação (ausente no map = 0). */
export async function getNoteCountsByScope(
  userId: string,
  scopeType: "LESSON" | "EXTERNAL_LESSON" | "WEEK",
  scopeIds: string[]
): Promise<Record<string, number>> {
  if (scopeIds.length === 0) return {};

  const rows = await db.note.groupBy({
    by: ["scopeId"],
    where: { userId, scopeType, scopeId: { in: scopeIds } },
    _count: { _all: true },
  });

  const counts: Record<string, number> = {};
  for (const row of rows) {
    if (row.scopeId) counts[row.scopeId] = row._count._all;
  }
  return counts;
}

export async function getAllTagsForUser(userId: string) {
  const notes = await db.note.findMany({ where: { userId }, select: { tags: true } });
  const tagSet = new Set<string>();
  for (const note of notes) {
    for (const tag of note.tags) tagSet.add(tag);
  }
  return [...tagSet].sort();
}
