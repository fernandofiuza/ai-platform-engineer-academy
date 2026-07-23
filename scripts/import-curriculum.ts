import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { importCurriculum } from "@/modules/curriculum-import/service";
import { db } from "@/lib/db";

async function main() {
  const force = process.argv.includes("--force");
  const sourceFile = "Curso.md";
  const filePath = path.resolve(process.cwd(), sourceFile);
  const rawContent = await readFile(filePath, "utf-8");

  const result = await importCurriculum({ sourceFile, rawContent, force });

  console.log("");
  console.log(result.skipped ? "Importação ignorada (sem mudanças)" : "Importação concluída");
  console.log(`  ${result.message}`);
  if (!result.skipped) {
    console.log(`  Criados: ${result.createdCount} · Atualizados: ${result.updatedCount} · Sem alteração: ${result.skippedCount}`);
  }

  if (result.warnings.length > 0) {
    console.log(`\n  ${result.warnings.length} aviso(s) para revisão administrativa:`);
    for (const warning of result.warnings) {
      console.log(`   - [${warning.targetEntityHint ?? "?"}] ${warning.reason}`);
      console.log(`     trecho: "${warning.excerpt}"`);
    }
  } else {
    console.log("\n  Nenhum aviso.");
  }
  console.log("");
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
