import "dotenv/config";

import { db } from "@/lib/db";
import { GeminiProvider } from "@/modules/artificial-intelligence/gemini-provider";
import { buildLessonGenerationMessage } from "@/modules/admin-curriculum/lesson-generation";
import { stripWeekDayPrefix } from "@/modules/planning/format";

function parseWeekList(): number[] {
  const fromArg = process.argv.find((a) => a.startsWith("--from="));
  const toArg = process.argv.find((a) => a.startsWith("--to="));
  const weeksArg = process.argv.find((a) => a.startsWith("--weeks="));

  if (weeksArg) {
    return weeksArg
      .slice("--weeks=".length)
      .split(",")
      .map((n) => Number(n.trim()))
      .filter((n) => Number.isFinite(n));
  }

  if (fromArg && toArg) {
    const from = Number(fromArg.slice("--from=".length));
    const to = Number(toArg.slice("--to=".length));
    const list: number[] = [];
    for (let n = from; n <= to; n++) list.push(n);
    return list;
  }

  return [];
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const weekNumbers = parseWeekList();
  const force = process.argv.includes("--force");

  if (weekNumbers.length === 0) {
    console.log("Uso: tsx scripts/generate-lessons-gemini.ts --from=1 --to=5 [--force]");
    console.log("  ou: tsx scripts/generate-lessons-gemini.ts --weeks=1,3,7 [--force]");
    process.exit(1);
  }

  const provider = new GeminiProvider();
  if (!process.env.AI_GEMINI_API_KEY) {
    console.error("AI_GEMINI_API_KEY não configurada no ambiente. Abortando.");
    process.exit(1);
  }

  console.log(`Gerando conteúdo via Gemini para as semanas: ${weekNumbers.join(", ")}`);
  console.log("");

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const weekNumber of weekNumbers) {
    const week = await db.week.findFirst({
      where: { number: weekNumber },
      include: { lessons: { orderBy: { order: "asc" } } },
    });

    if (!week) {
      console.log(`Semana ${weekNumber}: não encontrada — pulando.`);
      skipped++;
      continue;
    }

    const lessons = week.lessons.filter((l) => !l.isDemo);
    if (lessons.length === 0) {
      console.log(`Semana ${weekNumber}: sem aula cadastrada — pulando.`);
      skipped++;
      continue;
    }

    for (const lesson of lessons) {
      if (lesson.isManuallyEdited && !force) {
        console.log(`Semana ${weekNumber} dia ${lesson.order} (${lesson.title}): editada manualmente — pulando (use --force para sobrescrever).`);
        skipped++;
        continue;
      }

      process.stdout.write(`Semana ${weekNumber} dia ${lesson.order} — ${stripWeekDayPrefix(lesson.title)} ... `);

      try {
        const content = await provider.converse({
          persona: "PROFESSOR",
          message: buildLessonGenerationMessage(lesson),
          context: {
            currentLessonTitle: stripWeekDayPrefix(lesson.title),
            currentLessonContent: lesson.contentMarkdown ?? undefined,
            completedLessonTitles: [],
            openGoalTitles: [],
            recentQuizScores: [],
          },
        });

        await db.lesson.update({
          where: { id: lesson.id },
          data: { contentMarkdown: content, status: "AVAILABLE", aiGeneratedAt: new Date() },
        });

        console.log(`OK (${content.length} caracteres)`);
        generated++;
      } catch (error) {
        console.log(`FALHOU: ${String(error)}`);
        failed++;
      }

      // Espaça as chamadas para não estourar rate limit da API do Gemini.
      await sleep(4000);
    }
  }

  console.log("");
  console.log(`Concluído. Geradas: ${generated} · Puladas: ${skipped} · Falhas: ${failed}`);
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
