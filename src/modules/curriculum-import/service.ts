import { createHash } from "node:crypto";

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { parseCursoMarkdown, type ParsedPhase } from "./parser";

export const PROGRAM_SLUG = "ai-platform-engineer-academy";

export type ImportReport = {
  skipped: boolean;
  message: string;
  importJobId: string | null;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  warnings: { excerpt: string; reason: string; targetEntityHint?: string }[];
};

/**
 * Distribui `totalWeeks` o mais igualmente possível entre as fases, na ordem em que aparecem.
 * Curso.md não define os limites exatos de semana por semestre — essa distribuição é uma
 * decisão registrada em docs/DECISIONS.md, não um fato extraído do arquivo.
 */
function distributeWeeksAcrossPhases(totalWeeks: number, phases: ParsedPhase[]) {
  const phaseCount = phases.length;
  const base = Math.floor(totalWeeks / phaseCount);
  const remainder = totalWeeks - base * phaseCount;

  const ranges: { phaseOrder: number; start: number; end: number }[] = [];
  let cursor = 1;
  for (let i = 0; i < phaseCount; i++) {
    const size = base + (i < remainder ? 1 : 0);
    const start = cursor;
    const end = cursor + size - 1;
    ranges.push({ phaseOrder: phases[i].order, start, end });
    cursor = end + 1;
  }
  return ranges;
}

function weekNumberToPhaseOrder(
  weekNumber: number,
  ranges: { phaseOrder: number; start: number; end: number }[]
) {
  const range = ranges.find((r) => weekNumber >= r.start && weekNumber <= r.end);
  return range?.phaseOrder ?? null;
}

export async function importCurriculum(options: {
  sourceFile: string;
  rawContent: string;
  force?: boolean;
}): Promise<ImportReport> {
  const { sourceFile, rawContent, force = false } = options;
  const contentHash = createHash("sha256").update(rawContent).digest("hex");

  const lastSuccessfulJob = await db.importJob.findFirst({
    where: { sourceFile, contentHash },
    orderBy: { startedAt: "desc" },
  });

  if (lastSuccessfulJob && !force) {
    return {
      skipped: true,
      message: "Conteúdo idêntico à última importação bem-sucedida — nada a fazer.",
      importJobId: lastSuccessfulJob.id,
      createdCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      warnings: [],
    };
  }

  const parsed = parseCursoMarkdown(rawContent);
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  const job = await db.importJob.create({
    data: { sourceFile, contentHash },
  });

  // Program
  const existingProgram = await db.program.findUnique({ where: { slug: PROGRAM_SLUG } });
  const program = await db.program.upsert({
    where: { slug: PROGRAM_SLUG },
    update: {
      name: parsed.program.name,
      subtitle: parsed.program.subtitle,
      durationMonths: parsed.program.durationMonths,
      totalWeeks: parsed.program.totalWeeks,
      weeklyDays: parsed.program.weeklyDays,
      dailyHours: parsed.program.dailyHours,
    },
    create: {
      slug: PROGRAM_SLUG,
      name: parsed.program.name,
      subtitle: parsed.program.subtitle,
      durationMonths: parsed.program.durationMonths,
      totalWeeks: parsed.program.totalWeeks,
      weeklyDays: parsed.program.weeklyDays,
      dailyHours: parsed.program.dailyHours,
      status: "AVAILABLE",
    },
  });
  if (existingProgram) {
    updatedCount++;
  } else {
    createdCount++;
  }

  // Phases (semestres)
  const phaseIdByOrder = new Map<number, string>();
  for (const phase of parsed.phases) {
    const existing = await db.phase.findUnique({
      where: { programId_order: { programId: program.id, order: phase.order } },
    });
    const label = `Semestre ${phase.order}`;
    const saved = await db.phase.upsert({
      where: { programId_order: { programId: program.id, order: phase.order } },
      update: { name: phase.name, label },
      create: {
        programId: program.id,
        order: phase.order,
        name: phase.name,
        label,
        status: "AVAILABLE",
      },
    });
    if (existing) {
      updatedCount++;
    } else {
      createdCount++;
    }
    phaseIdByOrder.set(phase.order, saved.id);
  }

  // Semana 0 — Preparação do Ambiente (fora da numeração 1..N, sem fase)
  const existingWeekZero = await db.week.findUnique({
    where: { programId_number: { programId: program.id, number: 0 } },
  });
  const weekZero = await db.week.upsert({
    where: { programId_number: { programId: program.id, number: 0 } },
    update: {
      title: "Semana 0 — Preparação do Ambiente",
      isEnvironmentSetup: true,
      status: parsed.checklistItems.length > 0 ? "AVAILABLE" : "PLANNED",
    },
    create: {
      programId: program.id,
      phaseId: null,
      number: 0,
      title: "Semana 0 — Preparação do Ambiente",
      isEnvironmentSetup: true,
      status: parsed.checklistItems.length > 0 ? "AVAILABLE" : "PLANNED",
    },
  });
  if (existingWeekZero) {
    updatedCount++;
  } else {
    createdCount++;
  }

  for (const item of parsed.checklistItems) {
    const existing = await db.checklistItem.findUnique({
      where: {
        weekId_category_label: {
          weekId: weekZero.id,
          category: item.category,
          label: item.label,
        },
      },
    });
    await db.checklistItem.upsert({
      where: {
        weekId_category_label: {
          weekId: weekZero.id,
          category: item.category,
          label: item.label,
        },
      },
      update: { order: item.order },
      create: {
        weekId: weekZero.id,
        category: item.category,
        label: item.label,
        order: item.order,
      },
    });
    if (existing) {
      updatedCount++;
    } else {
      createdCount++;
    }
  }

  // Semanas 1..totalWeeks — estrutura vazia, distribuída pelos semestres
  if (parsed.phases.length > 0) {
    const ranges = distributeWeeksAcrossPhases(parsed.program.totalWeeks, parsed.phases);

    for (let number = 1; number <= parsed.program.totalWeeks; number++) {
      const phaseOrder = weekNumberToPhaseOrder(number, ranges);
      const phaseId = phaseOrder !== null ? (phaseIdByOrder.get(phaseOrder) ?? null) : null;

      const existing = await db.week.findUnique({
        where: { programId_number: { programId: program.id, number } },
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      await db.week.create({
        data: {
          programId: program.id,
          phaseId,
          number,
          title: `Semana ${number} — a definir`,
          status: "PLANNED",
        },
      });
      createdCount++;
    }
  }

  const report = {
    sourceFile,
    contentHash,
    createdCount,
    updatedCount,
    skippedCount,
    warnings: parsed.warnings,
  };

  await db.importJob.update({
    where: { id: job.id },
    data: {
      finishedAt: new Date(),
      createdCount,
      updatedCount,
      skippedCount,
      report,
      warnings: {
        create: parsed.warnings.map((w) => ({
          excerpt: w.excerpt,
          reason: w.reason,
          targetEntityHint: w.targetEntityHint,
        })),
      },
    },
  });

  logger.info("curriculum import finished", report);

  return {
    skipped: false,
    message: `Importação concluída: ${createdCount} criado(s), ${updatedCount} atualizado(s), ${skippedCount} sem alteração.`,
    importJobId: job.id,
    createdCount,
    updatedCount,
    skippedCount,
    warnings: parsed.warnings,
  };
}
