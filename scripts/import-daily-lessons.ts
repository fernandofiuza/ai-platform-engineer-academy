import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { importGradeDailyLessons } from "@/modules/curriculum-import/service";
import { db } from "@/lib/db";

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

async function main() {
  const weekNumbers = parseWeekList();
  if (weekNumbers.length === 0) {
    console.log("Uso: tsx scripts/import-daily-lessons.ts --from=50 --to=104");
    console.log("  ou: tsx scripts/import-daily-lessons.ts --weeks=50,51,52");
    process.exit(1);
  }

  const sourceFile = "Grade_Curricular.md";
  const filePath = path.resolve(process.cwd(), sourceFile);
  const rawContent = await readFile(filePath, "utf-8");

  const result = await importGradeDailyLessons({ rawContent, weekNumbers });

  console.log("");
  console.log(
    `Aulas diárias: ${result.createdCount} criada(s) · ${result.replacedWeeksCount} semana(s) substituída(s) · ${result.preservedWeeksCount} preservada(s) (editada manualmente).`
  );
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
