import { db } from "@/lib/db";
import { extractModuleName } from "@/modules/curriculum/module-name";

/** Deriva a lista de temas/subtemas a partir dos nomes de módulo das semanas já importadas
 * (mesma extração usada pelo Roadmap — `extractModuleName`) e garante que cada nome distinto
 * tenha uma linha em `Topic`. Idempotente: chamado de novo após cada importação de currículo não
 * duplica nem remove temas já vinculados a anotações. Nunca remove um `Topic` existente (mesmo se
 * o nome de módulo correspondente desaparecer do currículo) para não quebrar vínculos de
 * anotações já criadas pelo aluno. */
export async function syncTopicsFromWeeks(): Promise<{ createdCount: number }> {
  const weeks = await db.week.findMany({ select: { title: true } });
  const names = [...new Set(weeks.map((w) => extractModuleName(w.title)))].filter(Boolean);

  if (names.length === 0) return { createdCount: 0 };

  const existing = await db.topic.findMany({
    where: { name: { in: names } },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((t) => t.name));
  const toCreate = names.filter((name) => !existingNames.has(name));

  if (toCreate.length > 0) {
    await db.topic.createMany({
      data: toCreate.map((name) => ({ name })),
      skipDuplicates: true,
    });
  }

  return { createdCount: toCreate.length };
}
