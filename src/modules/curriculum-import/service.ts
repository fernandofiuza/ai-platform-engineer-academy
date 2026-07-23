import { createHash } from "node:crypto";

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { parseCursoMarkdown, type ParsedPhase } from "./parser";
import { parseGradeCurricular } from "./grade-parser";
import { distributeWeeksAcrossModules } from "./grade-distribution";
import { buildWeekLessons, buildDailyLessons } from "./grade-lessons";

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

  // Departamentos da AI Labs
  for (const dept of parsed.departments) {
    const existing = await db.department.findUnique({ where: { name: dept.name } });
    await db.department.upsert({
      where: { name: dept.name },
      update: { order: dept.order },
      create: { name: dept.name, order: dept.order },
    });
    if (existing) {
      updatedCount++;
    } else {
      createdCount++;
    }
  }

  // Linha do tempo de arquitetura da AI Labs (marcos ficam PLANNED até serem marcados como
  // alcançados pela administração — a importação nunca infere conclusão automaticamente)
  for (const milestone of parsed.architectureMilestones) {
    const existing = await db.architectureMilestone.findUnique({
      where: { track_order: { track: "AI_LABS", order: milestone.order } },
    });
    await db.architectureMilestone.upsert({
      where: { track_order: { track: "AI_LABS", order: milestone.order } },
      update: { title: milestone.title },
      create: { track: "AI_LABS", order: milestone.order, title: milestone.title, status: "PLANNED" },
    });
    if (existing) {
      updatedCount++;
    } else {
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

export type ModuleGridReport = {
  skipped: boolean;
  message: string;
  importJobId: string | null;
  updatedCount: number;
  skippedCount: number;
  projectCreated: boolean;
  warnings: { excerpt: string; reason: string }[];
};

/**
 * Distribui os módulos de Grade_Curricular.md pelas semanas 1..N já existentes (criadas por
 * `importCurriculum`), atualizando apenas título/objetivo — nunca `phaseId` (o vínculo com o
 * semestre não muda) e nunca semanas com `isManuallyEdited = true` (edições administrativas são
 * sempre preservadas). O bloco "PROJETO FINAL" vira um `Project` (não semanas) — ver
 * docs/CURRICULUM_IMPORT.md.
 */
export async function importModuleGrid(options: {
  sourceFile: string;
  rawContent: string;
  force?: boolean;
}): Promise<ModuleGridReport> {
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
      updatedCount: 0,
      skippedCount: 0,
      projectCreated: false,
      warnings: [],
    };
  }

  const program = await db.program.findUnique({ where: { slug: PROGRAM_SLUG } });
  if (!program) {
    throw new Error("Program não encontrado — rode a importação de Curso.md primeiro.");
  }

  const parsed = parseGradeCurricular(rawContent);
  const ranges = distributeWeeksAcrossModules(program.totalWeeks, parsed.modules);

  const weeks = await db.week.findMany({
    where: { programId: program.id, number: { gt: 0 } },
    orderBy: { number: "asc" },
  });
  const weekByNumber = new Map(weeks.map((w) => [w.number, w]));

  const job = await db.importJob.create({ data: { sourceFile, contentHash } });

  let updatedCount = 0;
  let skippedCount = 0;

  for (const range of ranges) {
    for (let number = range.startWeek; number <= range.endWeek; number++) {
      const week = weekByNumber.get(number);
      if (!week) continue;

      if (week.isManuallyEdited) {
        skippedCount++;
        continue;
      }

      await db.week.update({
        where: { id: week.id },
        data: {
          title: `Semana ${number} — ${range.module.name}`,
          objective: range.module.projectDescription
            ? `Projeto do módulo: ${range.module.projectDescription}`
            : undefined,
          status: "AVAILABLE",
        },
      });
      updatedCount++;
    }
  }

  let projectCreated = false;
  if (parsed.finalProject) {
    const existingProject = await db.project.findFirst({
      where: { title: `Projeto Final: ${parsed.finalProject.title}` },
    });

    if (!existingProject) {
      await db.project.create({
        data: {
          title: `Projeto Final: ${parsed.finalProject.title}`,
          problem: "Consolidar toda a formação em um produto comercial real.",
          context: parsed.finalProject.description,
          objective: `Construir a plataforma ${parsed.finalProject.title} como projeto de encerramento da formação.`,
          deliverables: parsed.finalProject.components,
          isDemo: false,
          status: "PLANNED",
        },
      });
      projectCreated = true;
    }
  }

  const report = {
    sourceFile,
    contentHash,
    updatedCount,
    skippedCount,
    projectCreated,
    warnings: parsed.warnings,
  };

  await db.importJob.update({
    where: { id: job.id },
    data: {
      finishedAt: new Date(),
      createdCount: projectCreated ? 1 : 0,
      updatedCount,
      skippedCount,
      report,
      warnings: {
        create: parsed.warnings.map((w) => ({ excerpt: w.excerpt, reason: w.reason })),
      },
    },
  });

  logger.info("grade curricular import finished", report);

  return {
    skipped: false,
    message: `Grade importada: ${updatedCount} semana(s) atualizada(s), ${skippedCount} preservada(s) (edição manual)${
      projectCreated ? ", Projeto Final criado" : ""
    }.`,
    importJobId: job.id,
    updatedCount,
    skippedCount,
    projectCreated,
    warnings: parsed.warnings,
  };
}

const LESSONS_SOURCE_TAG = "Grade_Curricular.md#lessons";

export type LessonGridReport = {
  skipped: boolean;
  message: string;
  importJobId: string | null;
  createdCount: number;
  skippedCount: number;
};

/**
 * Gera 1 `Lesson` real por semana (1..N), a partir dos tópicos de cada módulo distribuídos por
 * `buildWeekLessons` (grade-lessons.ts). Idempotente por `ImportJob.contentHash` (mesmo padrão de
 * `importModuleGrid`) e, dentro de uma mesma execução forçada, pula qualquer semana que já tenha
 * uma aula não-demo (nunca duplica nem sobrescreve conteúdo já existente). Ver
 * docs/CURRICULUM_IMPORT.md.
 */
export async function importGradeLessons(options: {
  rawContent: string;
  force?: boolean;
}): Promise<LessonGridReport> {
  const { rawContent, force = false } = options;
  const contentHash = createHash("sha256").update(rawContent).digest("hex");

  const lastSuccessfulJob = await db.importJob.findFirst({
    where: { sourceFile: LESSONS_SOURCE_TAG, contentHash },
    orderBy: { startedAt: "desc" },
  });

  if (lastSuccessfulJob && !force) {
    return {
      skipped: true,
      message: "Conteúdo idêntico à última geração de aulas — nada a fazer.",
      importJobId: lastSuccessfulJob.id,
      createdCount: 0,
      skippedCount: 0,
    };
  }

  const program = await db.program.findUnique({ where: { slug: PROGRAM_SLUG } });
  if (!program) {
    throw new Error("Program não encontrado — rode a importação de Curso.md primeiro.");
  }

  const parsed = parseGradeCurricular(rawContent);
  const ranges = distributeWeeksAcrossModules(program.totalWeeks, parsed.modules);

  const weeks = await db.week.findMany({
    where: { programId: program.id, number: { gt: 0 } },
    include: { lessons: true },
  });
  const weekByNumber = new Map(weeks.map((w) => [w.number, w]));

  const durationMinutes = Math.round(program.weeklyDays * program.dailyHours * 60);

  const job = await db.importJob.create({ data: { sourceFile: LESSONS_SOURCE_TAG, contentHash } });

  let createdCount = 0;
  let skippedCount = 0;

  for (const range of ranges) {
    const lessonsForRange = buildWeekLessons(range);
    for (const lessonContent of lessonsForRange) {
      const week = weekByNumber.get(lessonContent.weekNumber);
      if (!week) continue;

      const hasRealLesson = week.lessons.some((l) => !l.isDemo);
      if (hasRealLesson) {
        skippedCount++;
        continue;
      }

      await db.lesson.create({
        data: {
          weekId: week.id,
          order: 1,
          title: lessonContent.title,
          objective: lessonContent.objective,
          durationMinutes,
          contentMarkdown: lessonContent.contentMarkdown,
          isDemo: false,
          status: "AVAILABLE",
        },
      });
      createdCount++;
    }
  }

  const report = { sourceFile: LESSONS_SOURCE_TAG, contentHash, createdCount, skippedCount };

  await db.importJob.update({
    where: { id: job.id },
    data: { finishedAt: new Date(), createdCount, skippedCount, report },
  });

  logger.info("grade lessons import finished", report);

  return {
    skipped: false,
    message: `Aulas geradas: ${createdCount} criada(s), ${skippedCount} pulada(s) (semana já tinha aula real).`,
    importJobId: job.id,
    createdCount,
    skippedCount,
  };
}

export type DailyLessonImportReport = {
  createdCount: number;
  replacedWeeksCount: number;
  preservedWeeksCount: number;
  message: string;
};

/**
 * Substitui a(s) aula(s) de cada semana informada por 1 `Lesson` por dia (`Program.weeklyDays`,
 * normalmente 5) — a unidade de conteúdo passa a ser o dia, não a semana (decisão explícita do
 * usuário, ver docs/DECISIONS.md). Semanas com alguma aula `isManuallyEdited` são puladas e
 * preservadas integralmente. Diferente de `importGradeLessons`, esta função **substitui**
 * (delete + recreate) em vez de só criar quando não existe — é uma operação de regeneração
 * deliberada, não uma importação idempotente repetida automaticamente.
 */
export async function importGradeDailyLessons(options: {
  rawContent: string;
  weekNumbers: number[];
}): Promise<DailyLessonImportReport> {
  const program = await db.program.findUnique({ where: { slug: PROGRAM_SLUG } });
  if (!program) {
    throw new Error("Program não encontrado — rode a importação de Curso.md primeiro.");
  }

  const parsed = parseGradeCurricular(options.rawContent);
  const ranges = distributeWeeksAcrossModules(program.totalWeeks, parsed.modules);

  const weeks = await db.week.findMany({
    where: { programId: program.id, number: { in: options.weekNumbers } },
    include: { lessons: true },
  });
  const weekByNumber = new Map(weeks.map((w) => [w.number, w]));
  const durationMinutes = Math.round(program.dailyHours * 60);

  let createdCount = 0;
  let replacedWeeksCount = 0;
  let preservedWeeksCount = 0;

  for (const range of ranges) {
    const relevantWeekNumbers = options.weekNumbers.filter(
      (n) => n >= range.startWeek && n <= range.endWeek
    );
    if (relevantWeekNumbers.length === 0) continue;

    const dailyLessons = buildDailyLessons(range, program.weeklyDays);
    const byWeek = new Map<number, typeof dailyLessons>();
    for (const dl of dailyLessons) {
      if (!relevantWeekNumbers.includes(dl.weekNumber)) continue;
      if (!byWeek.has(dl.weekNumber)) byWeek.set(dl.weekNumber, []);
      byWeek.get(dl.weekNumber)!.push(dl);
    }

    for (const [weekNumber, lessonsForWeek] of byWeek) {
      const week = weekByNumber.get(weekNumber);
      if (!week) continue;

      if (week.lessons.some((l) => l.isManuallyEdited)) {
        preservedWeeksCount++;
        continue;
      }

      if (week.lessons.length > 0) {
        await db.lesson.deleteMany({ where: { weekId: week.id } });
        replacedWeeksCount++;
      }

      for (const dl of lessonsForWeek) {
        await db.lesson.create({
          data: {
            weekId: week.id,
            order: dl.dayNumber,
            title: dl.title,
            objective: dl.objective,
            durationMinutes,
            contentMarkdown: dl.contentMarkdown,
            isDemo: false,
            status: "AVAILABLE",
          },
        });
        createdCount++;
      }
    }
  }

  logger.info("grade daily lessons import finished", { createdCount, replacedWeeksCount, preservedWeeksCount });

  return {
    createdCount,
    replacedWeeksCount,
    preservedWeeksCount,
    message: `${createdCount} aula(s) diária(s) criada(s) em ${replacedWeeksCount} semana(s) substituída(s) (${preservedWeeksCount} semana(s) preservada(s) por edição manual).`,
  };
}
