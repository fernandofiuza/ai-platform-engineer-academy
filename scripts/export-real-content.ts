import "dotenv/config";
import { writeFile } from "node:fs/promises";
import path from "node:path";

import { db } from "@/lib/db";

const MIN_LESSON_LENGTH = 3000;
const MIN_LAB_LENGTH = 1000;

async function main() {
  const lessons = await db.lesson.findMany({
    where: { contentMarkdown: { not: null }, week: { number: { gt: 0 } } },
    include: { week: true },
    orderBy: [{ week: { number: "asc" } }, { order: "asc" }],
  });

  const realLessons = lessons.filter((l) => (l.contentMarkdown?.length ?? 0) > MIN_LESSON_LENGTH);

  const labs = await db.laboratory.findMany({
    where: { instructions: { not: null } },
    include: { lessons: { include: { lesson: { include: { week: true } } } } },
  });

  const realLabs = labs.filter((l) => (l.instructions?.length ?? 0) > MIN_LAB_LENGTH);

  const output = {
    exportedAt: new Date().toISOString(),
    lessons: realLessons.map((l) => ({
      weekNumber: l.week.number,
      order: l.order,
      title: l.title,
      objective: l.objective,
      durationMinutes: l.durationMinutes,
      contentMarkdown: l.contentMarkdown,
      status: l.status,
      aiGeneratedAt: l.aiGeneratedAt,
    })),
    laboratories: realLabs.map((lab) => ({
      title: lab.title,
      scenario: lab.scenario,
      objective: lab.objective,
      environment: lab.environment,
      prerequisites: lab.prerequisites,
      instructions: lab.instructions,
      commands: lab.commands,
      expectedResult: lab.expectedResult,
      validation: lab.validation,
      troubleshooting: lab.troubleshooting,
      status: lab.status,
      aiGeneratedAt: lab.aiGeneratedAt,
      weekOrderPairs: lab.lessons.map((ll) => ({
        weekNumber: ll.lesson.week.number,
        order: ll.lesson.order,
      })),
    })),
  };

  const outPath = path.resolve(process.cwd(), "scripts/data/real-content-export.json");
  await writeFile(outPath, JSON.stringify(output), "utf-8");

  console.log(`Exportado: ${output.lessons.length} aulas, ${output.laboratories.length} laboratórios.`);
  console.log(`Semanas cobertas (aulas): ${[...new Set(output.lessons.map((l) => l.weekNumber))].join(", ")}`);
  console.log(`Arquivo: ${outPath}`);
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
