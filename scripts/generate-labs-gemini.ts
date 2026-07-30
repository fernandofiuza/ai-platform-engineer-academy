import "dotenv/config";

import { db } from "@/lib/db";
import { GeminiProvider } from "@/modules/artificial-intelligence/gemini-provider";
import { buildLabGenerationMessage } from "@/modules/laboratories/lab-generation";
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

  if (weekNumbers.length === 0) {
    console.log("Uso: tsx scripts/generate-labs-gemini.ts --from=1 --to=5");
    console.log("  ou: tsx scripts/generate-labs-gemini.ts --weeks=1,3,7");
    process.exit(1);
  }

  if (!process.env.AI_GEMINI_API_KEY) {
    console.error("AI_GEMINI_API_KEY não configurada no ambiente. Abortando.");
    process.exit(1);
  }

  const provider = new GeminiProvider();

  console.log(`Gerando laboratórios via Gemini para as semanas: ${weekNumbers.join(", ")}`);
  console.log("");

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const weekNumber of weekNumbers) {
    const week = await db.week.findFirst({
      where: { number: weekNumber },
      include: {
        lessons: {
          orderBy: { order: "asc" },
          include: { laboratories: { include: { laboratory: true } } },
        },
      },
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

    const existingLab = lessons.flatMap((l) => l.laboratories.map((ll) => ll.laboratory))[0];
    if (existingLab?.isManuallyEdited) {
      console.log(`Semana ${weekNumber}: laboratório editado manualmente — pulando.`);
      skipped++;
      continue;
    }
    if (existingLab) {
      console.log(`Semana ${weekNumber}: já tem laboratório — pulando.`);
      skipped++;
      continue;
    }

    const theme = stripWeekDayPrefix(week.title ?? lessons[0].title);
    process.stdout.write(`Semana ${weekNumber} — ${theme} ... `);

    try {
      const instructions = await provider.converse({
        persona: "PROFESSOR",
        message: buildLabGenerationMessage({
          scenario: theme,
          lessons: lessons.map((l) => ({ title: stripWeekDayPrefix(l.title), objective: l.objective })),
        }),
        context: {
          currentLessonTitle: theme,
          currentLessonContent: lessons
            .map((l) => (l.contentMarkdown ? `${stripWeekDayPrefix(l.title)}: ${l.contentMarkdown.slice(0, 400)}...` : null))
            .filter(Boolean)
            .join("\n\n"),
          completedLessonTitles: [],
          openGoalTitles: [],
          recentQuizScores: [],
        },
      });

      await db.laboratory.create({
        data: {
          title: `Laboratório — ${theme}`,
          scenario: theme,
          instructions,
          isDemo: false,
          aiGeneratedAt: new Date(),
          status: "AVAILABLE",
          lessons: { create: lessons.map((l) => ({ lessonId: l.id })) },
        },
      });

      console.log(`OK (${instructions.length} caracteres)`);
      generated++;
    } catch (error) {
      console.log(`FALHOU: ${String(error)}`);
      failed++;
    }

    // Espaça as chamadas para não estourar rate limit da API do Gemini.
    await sleep(4000);
  }

  console.log("");
  console.log(`Concluído. Gerados: ${generated} · Pulados: ${skipped} · Falhas: ${failed}`);
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
