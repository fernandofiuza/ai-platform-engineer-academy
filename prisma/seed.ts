import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";

import { db } from "../src/lib/db";
import { importCurriculum, PROGRAM_SLUG } from "../src/modules/curriculum-import/service";

const DEMO_PASSWORD = "Demo@1234";

async function seedUsers() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const admin = await db.user.upsert({
    where: { email: "admin@apea.dev" },
    update: {},
    create: {
      name: "Admin AI Labs",
      email: "admin@apea.dev",
      passwordHash,
      role: "ADMIN",
      profile: { create: {} },
    },
  });

  const student = await db.user.upsert({
    where: { email: "estudante@apea.dev" },
    update: {},
    create: {
      name: "Estudante Demonstração",
      email: "estudante@apea.dev",
      passwordHash,
      role: "STUDENT",
      profile: { create: {} },
    },
  });

  return { admin, student };
}

async function seedCurriculum() {
  const sourceFile = "Curso.md";
  const filePath = path.resolve(process.cwd(), sourceFile);
  const rawContent = await readFile(filePath, "utf-8");
  return importCurriculum({ sourceFile, rawContent });
}

async function seedDemoLessons() {
  const program = await db.program.findUnique({ where: { slug: PROGRAM_SLUG } });
  if (!program) return;

  const weekZero = await db.week.findUnique({
    where: { programId_number: { programId: program.id, number: 0 } },
  });
  if (!weekZero) return;

  await db.lesson.upsert({
    where: { weekId_order: { weekId: weekZero.id, order: 0 } },
    update: {},
    create: {
      weekId: weekZero.id,
      order: 0,
      title: "Bem-vindo à AI Platform Engineer Academy",
      objective: "Entender o que é a formação, sua duração e o que ela vai cobrir.",
      durationMinutes: 15,
      isDemo: true,
      status: "AVAILABLE",
      contentMarkdown: `# ${program.name}\n\n**${program.subtitle}**\n\nEsta é uma formação de aproximadamente ${program.durationMonths} meses (${program.totalWeeks} semanas), com ${program.weeklyDays} dias de estudo por semana e ${program.dailyHours}h por dia.\n\nEm vez de dezenas de projetos desconectados, você vai construir uma única plataforma que evolui a cada módulo — a mesma que você está usando agora.\n\n> Conteúdo de demonstração (aula de exemplo), extraído de \`Curso.md\`. A grade semanal completa ainda está em construção — ver o Roadmap.`,
    },
  });

  await db.lesson.upsert({
    where: { weekId_order: { weekId: weekZero.id, order: 1 } },
    update: {},
    create: {
      weekId: weekZero.id,
      order: 1,
      title: "O princípio da formação: aprender aplicando",
      objective: "Entender a metodologia baseada em projetos reais.",
      durationMinutes: 10,
      isDemo: true,
      status: "AVAILABLE",
      contentMarkdown: `## "Nunca estudar uma tecnologia sem aplicá-la em um projeto real."\n\nEsse é o princípio central da formação.\n\n- Se aprendermos Redis, ele entra na plataforma.\n- Se aprendermos Docker, fazemos o deploy da plataforma.\n- Se aprendermos observabilidade, monitoramos a aplicação.\n\nCada tecnologia estudada precisa aparecer, de forma verificável, na mesma plataforma que evolui com você ao longo dos 6 semestres.\n\n> Conteúdo de demonstração (aula de exemplo), extraído de \`Curso.md\`.`,
    },
  });
}

async function main() {
  const { admin, student } = await seedUsers();
  const importResult = await seedCurriculum();
  await seedDemoLessons();

  console.log("\nSeed concluído.");
  console.log("\nUsuários de demonstração (apenas para desenvolvimento local):");
  console.log(`  Admin:     ${admin.email} / ${DEMO_PASSWORD}`);
  console.log(`  Estudante: ${student.email} / ${DEMO_PASSWORD}`);
  console.log(`\nCurrículo: ${importResult.message}`);
  if (importResult.warnings.length > 0) {
    console.log(`  ${importResult.warnings.length} aviso(s) — ver 'npm run curriculum:import' para detalhes.`);
  }
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
