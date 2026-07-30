import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { db } from "@/lib/db";

type ExportedLesson = {
  weekNumber: number;
  order: number;
  title: string;
  objective: string | null;
  durationMinutes: number | null;
  contentMarkdown: string | null;
  status: string;
  aiGeneratedAt: string | null;
};

type ExportedLab = {
  title: string;
  scenario: string | null;
  objective: string | null;
  environment: string | null;
  prerequisites: string[];
  instructions: string | null;
  commands: string | null;
  expectedResult: string | null;
  validation: string | null;
  troubleshooting: string | null;
  status: string;
  aiGeneratedAt: string | null;
  weekOrderPairs: { weekNumber: number; order: number }[];
};

async function main() {
  const filePath = path.resolve(process.cwd(), "scripts/data/real-content-export.json");
  const raw = await readFile(filePath, "utf-8");
  const data = JSON.parse(raw) as { lessons: ExportedLesson[]; laboratories: ExportedLab[] };

  const weekNumbers = [...new Set(data.lessons.map((l) => l.weekNumber))];
  const weeks = await db.week.findMany({
    where: { number: { in: weekNumbers } },
    include: { lessons: true },
  });
  const weekByNumber = new Map(weeks.map((w) => [w.number, w]));

  let weeksReplaced = 0;
  let weeksSkipped = 0;
  const lessonIdByWeekOrder = new Map<string, string>();

  for (const weekNumber of weekNumbers) {
    const week = weekByNumber.get(weekNumber);
    if (!week) {
      console.log(`Semana ${weekNumber}: não encontrada em produção — pulando.`);
      continue;
    }

    if (week.lessons.some((l) => l.isManuallyEdited)) {
      console.log(`Semana ${weekNumber}: tem aula editada manualmente em produção — pulando.`);
      weeksSkipped++;
      continue;
    }

    const lessonsForWeek = data.lessons.filter((l) => l.weekNumber === weekNumber);

    await db.lesson.deleteMany({ where: { weekId: week.id } });

    for (const l of lessonsForWeek) {
      const created = await db.lesson.create({
        data: {
          weekId: week.id,
          order: l.order,
          title: l.title,
          objective: l.objective,
          durationMinutes: l.durationMinutes,
          contentMarkdown: l.contentMarkdown,
          isDemo: false,
          status: l.status as never,
          aiGeneratedAt: l.aiGeneratedAt ? new Date(l.aiGeneratedAt) : null,
        },
      });
      lessonIdByWeekOrder.set(`${weekNumber}:${l.order}`, created.id);
    }

    weeksReplaced++;
    console.log(`Semana ${weekNumber}: ${lessonsForWeek.length} aula(s) real(is) aplicada(s).`);
  }

  console.log("");
  console.log(`Aulas: ${weeksReplaced} semana(s) substituída(s), ${weeksSkipped} pulada(s).`);
  console.log("");

  // Além das aulas que acabaram de ser (re)criadas acima, os laboratórios também podem apontar
  // para semanas que já tinham aula em produção antes deste import (ex.: semanas 50+, que ainda
  // só têm o esqueleto semanal) — sem isso, qualquer laboratório fora do range 1-49 ficaria sem
  // aula para vincular e seria pulado incorretamente.
  const labWeekNumbers = [...new Set(data.laboratories.flatMap((l) => l.weekOrderPairs.map((p) => p.weekNumber)))];
  const missingWeekNumbers = labWeekNumbers.filter((n) => !weekNumbers.includes(n));
  if (missingWeekNumbers.length > 0) {
    const extraLessons = await db.lesson.findMany({
      where: { week: { number: { in: missingWeekNumbers } } },
      include: { week: true },
    });
    for (const l of extraLessons) {
      lessonIdByWeekOrder.set(`${l.week.number}:${l.order}`, l.id);
    }
  }

  let labsCreated = 0;
  let labsSkipped = 0;

  for (const lab of data.laboratories) {
    const existing = await db.laboratory.findFirst({ where: { title: lab.title } });
    if (existing) {
      labsSkipped++;
      continue;
    }

    const lessonIds = lab.weekOrderPairs
      .map((p) => lessonIdByWeekOrder.get(`${p.weekNumber}:${p.order}`))
      .filter((id): id is string => Boolean(id));

    if (lessonIds.length === 0) {
      console.log(`Laboratório "${lab.title}": nenhuma aula correspondente em produção — pulando.`);
      labsSkipped++;
      continue;
    }

    await db.laboratory.create({
      data: {
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
        isDemo: false,
        status: lab.status as never,
        aiGeneratedAt: lab.aiGeneratedAt ? new Date(lab.aiGeneratedAt) : null,
        lessons: { create: lessonIds.map((lessonId) => ({ lessonId })) },
      },
    });
    labsCreated++;
  }

  console.log(`Laboratórios: ${labsCreated} criado(s), ${labsSkipped} pulado(s) (já existia ou sem aula vinculável).`);
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
