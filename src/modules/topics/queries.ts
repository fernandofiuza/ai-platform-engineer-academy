import { db } from "@/lib/db";

export async function getAllTopics() {
  return db.topic.findMany({ orderBy: { name: "asc" } });
}

export async function getTopicByName(name: string) {
  return db.topic.findUnique({ where: { name } });
}

/** Contagem de anotações do usuário por tema, indexada pelo *nome* do tema (não pelo id) — para
 * anotar diretamente rótulos de módulo já renderizados como texto (Roadmap, Laboratórios) sem
 * precisar que esses componentes conheçam o id do `Topic` a priori. Cada entrada já traz o id do
 * tema junto, para montar o atalho para `/notes?topic=<id>`. */
export async function getTopicNoteCountsByName(
  userId: string
): Promise<Record<string, { topicId: string; count: number }>> {
  const rows = await db.noteTopic.findMany({
    where: { note: { userId } },
    select: { topic: { select: { id: true, name: true } } },
  });

  const counts: Record<string, { topicId: string; count: number }> = {};
  for (const row of rows) {
    const existing = counts[row.topic.name];
    counts[row.topic.name] = { topicId: row.topic.id, count: (existing?.count ?? 0) + 1 };
  }
  return counts;
}

export async function getNotesForTopic(userId: string, topicId: string) {
  return db.note.findMany({
    where: { userId, topics: { some: { topicId } } },
    include: {
      topics: { include: { topic: true } },
      attachments: { orderBy: { createdAt: "asc" } },
    },
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
  });
}
