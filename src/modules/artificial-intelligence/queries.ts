import { db } from "@/lib/db";

export async function getRecentConversationMessages(userId: string, limit = 20) {
  const conversation = await db.aIConversation.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: limit },
    },
  });
  return conversation?.messages ?? [];
}
