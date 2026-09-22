import "dotenv/config";

import { db } from "@/lib/db";
import { syncTopicsFromWeeks } from "@/modules/topics/service";

async function main() {
  const result = await syncTopicsFromWeeks();
  console.log(`Temas sincronizados. ${result.createdCount} criado(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
