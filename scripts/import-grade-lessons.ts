import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { importGradeLessons } from "@/modules/curriculum-import/service";
import { db } from "@/lib/db";

async function main() {
  const force = process.argv.includes("--force");
  const sourceFile = "Grade_Curricular.md";
  const filePath = path.resolve(process.cwd(), sourceFile);
  const rawContent = await readFile(filePath, "utf-8");

  const result = await importGradeLessons({ rawContent, force });

  console.log("");
  console.log(result.skipped ? "Geração de aulas ignorada (sem mudanças)" : "Geração de aulas concluída");
  console.log(`  ${result.message}`);
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
