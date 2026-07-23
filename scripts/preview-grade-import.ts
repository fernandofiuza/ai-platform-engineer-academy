import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { db } from "../src/lib/db";
import { parseGradeCurricular } from "../src/modules/curriculum-import/grade-parser";
import { distributeWeeksAcrossModules } from "../src/modules/curriculum-import/grade-distribution";
import { PROGRAM_SLUG } from "../src/modules/curriculum-import/service";

async function main() {
  const filePath = path.resolve(process.cwd(), "Grade_Curricular.md");
  const rawContent = await readFile(filePath, "utf-8");
  const parsed = parseGradeCurricular(rawContent);

  const program = await db.program.findUnique({ where: { slug: PROGRAM_SLUG } });
  if (!program) {
    console.log("Program não encontrado — rode 'npm run curriculum:import' primeiro.");
    await db.$disconnect();
    return;
  }

  const ranges = distributeWeeksAcrossModules(program.totalWeeks, parsed.modules);

  const weeks = await db.week.findMany({
    where: { programId: program.id, number: { gt: 0 } },
    orderBy: { number: "asc" },
    include: { phase: true },
  });
  const weekByNumber = new Map(weeks.map((w) => [w.number, w]));

  console.log(`\n=== PREVIEW (dry-run — nada foi gravado no banco) ===\n`);
  console.log(`Módulos reconhecidos: ${parsed.modules.length}`);
  console.log(`Peso total: ${parsed.modules.reduce((s, m) => s + m.weight, 0)}`);
  console.log(`Semanas do programa: ${program.totalWeeks}\n`);

  console.log(
    "Módulo".padEnd(32) + "Peso".padStart(6) + "  Semanas".padStart(10) + "  Intervalo".padStart(14)
  );
  console.log("-".repeat(70));

  let totalManuallyEdited = 0;
  let totalToUpdate = 0;

  for (const range of ranges) {
    const rangeWeeks = [];
    for (let n = range.startWeek; n <= range.endWeek; n++) {
      const week = weekByNumber.get(n);
      if (week) rangeWeeks.push(week);
    }
    const manuallyEdited = rangeWeeks.filter((w) => w.isManuallyEdited);
    totalManuallyEdited += manuallyEdited.length;
    totalToUpdate += rangeWeeks.length - manuallyEdited.length;

    const label = `${range.module.order}. ${range.module.name}`;
    console.log(
      label.padEnd(32) +
        String(range.module.weight).padStart(6) +
        String(range.weekCount).padStart(10) +
        `  ${range.startWeek}-${range.endWeek}`.padStart(14) +
        (manuallyEdited.length > 0 ? `  ⚠ ${manuallyEdited.length} semana(s) preservada(s) (editada manualmente)` : "")
    );
    if (range.module.projectDescription) {
      console.log(`   projeto: ${range.module.projectDescription}`);
    }
  }

  console.log("-".repeat(70));
  console.log(`Total: ${ranges.reduce((s, r) => s + r.weekCount, 0)} semanas`);
  console.log(`  → ${totalToUpdate} semana(s) serão atualizadas (título + objetivo)`);
  console.log(`  → ${totalManuallyEdited} semana(s) preservadas (editadas manualmente, não serão tocadas)`);

  if (parsed.finalProject) {
    console.log(`\n=== Projeto Final (vira um Project, não semanas) ===`);
    console.log(`Título: ${parsed.finalProject.title}`);
    console.log(`Descrição: ${parsed.finalProject.description}`);
    console.log(`Componentes (${parsed.finalProject.components.length}):`);
    for (const c of parsed.finalProject.components) console.log(`  - ${c}`);
  }

  if (parsed.warnings.length > 0) {
    console.log(`\n=== Avisos (${parsed.warnings.length}) ===`);
    for (const w of parsed.warnings) console.log(`  - ${w.reason} (trecho: "${w.excerpt}")`);
  } else {
    console.log("\nNenhum aviso.");
  }

  console.log(
    "\nNada foi gravado no banco. Para aplicar de verdade, rode: npm run curriculum:import-grade\n"
  );

  await db.$disconnect();
}

main();
