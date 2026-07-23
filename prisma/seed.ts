import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";

import { db } from "../src/lib/db";
import { importCurriculum, PROGRAM_SLUG } from "../src/modules/curriculum-import/service";
import { seedBadgeCatalog } from "../src/modules/gamification/service";

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
  if (!program) return null;

  const weekZero = await db.week.findUnique({
    where: { programId_number: { programId: program.id, number: 0 } },
  });
  if (!weekZero) return null;

  const welcomeLesson = await db.lesson.upsert({
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

  const principleLesson = await db.lesson.upsert({
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

  return { welcomeLesson, principleLesson, program };
}

async function seedAssessment(welcomeLessonId: string, programName: string) {
  const existing = await db.assessment.findFirst({
    where: { lessonId: welcomeLessonId, title: "Quiz: conhecendo a formação" },
  });
  if (existing) return;

  await db.assessment.create({
    data: {
      lessonId: welcomeLessonId,
      title: "Quiz: conhecendo a formação",
      status: "AVAILABLE",
      questions: {
        create: [
          {
            order: 0,
            prompt: "Qual é o nome da formação?",
            type: "MULTIPLE_CHOICE",
            explanation: `O nome oficial é "${programName}".`,
            options: {
              create: [
                { order: 0, text: programName, isCorrect: true },
                { order: 1, text: "APEX Academy", isCorrect: false },
                { order: 2, text: "AI Agent Bootcamp", isCorrect: false },
              ],
            },
          },
          {
            order: 1,
            prompt: "Aproximadamente quantas semanas tem a formação?",
            type: "MULTIPLE_CHOICE",
            explanation: "24 meses ÷ carga semanal ≈ 104 semanas.",
            options: {
              create: [
                { order: 0, text: "52 semanas", isCorrect: false },
                { order: 1, text: "104 semanas", isCorrect: true },
                { order: 2, text: "12 semanas", isCorrect: false },
              ],
            },
          },
          {
            order: 2,
            prompt: 'Qual princípio guia a metodologia da formação?',
            type: "MULTIPLE_CHOICE",
            explanation:
              'Ver a aula "O princípio da formação: aprender aplicando".',
            options: {
              create: [
                { order: 0, text: "Estudar teoria antes de qualquer prática", isCorrect: false },
                {
                  order: 1,
                  text: "Nunca estudar uma tecnologia sem aplicá-la em um projeto real",
                  isCorrect: true,
                },
                { order: 2, text: "Priorizar certificações externas", isCorrect: false },
              ],
            },
          },
        ],
      },
    },
  });
}

async function seedFlashcards(lessonIds: { welcomeLessonId: string; principleLessonId: string }) {
  const cards = [
    {
      lessonId: lessonIds.welcomeLessonId,
      question: "Quantos meses dura a AI Platform Engineer Academy?",
      answer: "Aproximadamente 24 meses (104 semanas).",
      tags: ["formação"],
    },
    {
      lessonId: lessonIds.welcomeLessonId,
      question: "Quantas horas de estudo por dia a formação prevê?",
      answer: "3h30 por dia, 5 dias por semana.",
      tags: ["formação"],
    },
    {
      lessonId: lessonIds.principleLessonId,
      question: 'Complete: "Nunca estudar uma tecnologia sem ___"',
      answer: "aplicá-la em um projeto real.",
      tags: ["metodologia"],
    },
  ];

  for (const card of cards) {
    const existing = await db.flashcard.findFirst({ where: { question: card.question } });
    if (existing) continue;
    await db.flashcard.create({ data: card });
  }
}

const SKILL_CATALOG = [
  { name: "Engenharia de Software", category: "Fundamentos" },
  { name: "Backend", category: "Desenvolvimento" },
  { name: "Frontend", category: "Desenvolvimento" },
  { name: "Banco de Dados", category: "Dados" },
  { name: "Infraestrutura", category: "Infraestrutura" },
  { name: "DevOps", category: "Infraestrutura" },
  { name: "Cloud (AWS)", category: "Infraestrutura" },
  { name: "Inteligência Artificial", category: "IA" },
  { name: "Automação", category: "IA" },
  { name: "Arquitetura Corporativa", category: "Arquitetura" },
  { name: "Segurança", category: "Arquitetura" },
  { name: "Observabilidade", category: "Arquitetura" },
  { name: "Engenharia de Produto", category: "Soft Skills" },
  { name: "Soft Skills", category: "Soft Skills" },
];

async function seedSkills(lessonIds: { welcomeLessonId: string; principleLessonId: string }) {
  const skillByName = new Map<string, { id: string }>();
  for (const skill of SKILL_CATALOG) {
    const saved = await db.skill.upsert({
      where: { name: skill.name },
      update: { category: skill.category },
      create: { name: skill.name, category: skill.category, status: "DRAFT" },
    });
    skillByName.set(skill.name, saved);
  }

  const links = [
    { lessonId: lessonIds.welcomeLessonId, skillName: "Engenharia de Produto" },
    { lessonId: lessonIds.principleLessonId, skillName: "Engenharia de Software" },
  ];

  for (const link of links) {
    const skill = skillByName.get(link.skillName);
    if (!skill) continue;
    await db.lessonSkill.upsert({
      where: { lessonId_skillId: { lessonId: link.lessonId, skillId: skill.id } },
      update: {},
      create: { lessonId: link.lessonId, skillId: skill.id },
    });
  }
}

async function seedProjectAndLab() {
  const existingProject = await db.project.findFirst({
    where: { title: "Construir a própria plataforma de estudos" },
  });
  if (!existingProject) {
    await db.project.create({
      data: {
        title: "Construir a própria plataforma de estudos",
        problem:
          "Em vez de dezenas de projetos desconectados, a formação usa uma única plataforma que evolui a cada módulo.",
        context: "Esta própria aplicação (AI Platform Engineer Academy) é o projeto contínuo da formação.",
        objective: "Aplicar cada tecnologia estudada nesta plataforma, de forma verificável.",
        requirements: [
          "Publicar o código em um repositório Git com README",
          "Registrar decisões técnicas relevantes",
        ],
        optionalRequirements: ["Deploy público", "Pipeline de CI/CD"],
        deliverables: ["Repositório", "Documentação"],
        acceptanceCriteria: [
          "O repositório existe e está acessível",
          "O README explica como rodar o projeto",
        ],
        isDemo: true,
        status: "AVAILABLE",
      },
    });
  }

  const existingLab = await db.laboratory.findFirst({
    where: { title: "Preparar o ambiente com Docker Compose" },
  });
  if (!existingLab) {
    await db.laboratory.create({
      data: {
        title: "Preparar o ambiente com Docker Compose",
        objective: "Confirmar que o PostgreSQL local sobe corretamente via Docker.",
        environment: "Docker Desktop (ou engine compatível) instalado.",
        prerequisites: ["Docker instalado", "Repositório clonado"],
        instructions: "Rode o comando abaixo na raiz do projeto e confirme que o container fica 'healthy'.",
        commands: "npm run docker:db\ndocker compose ps",
        expectedResult: "Container 'db' com status healthy.",
        validation: "docker compose ps deve mostrar '(healthy)' ao lado do serviço db.",
        troubleshooting: "Se a porta 5432 já estiver em uso, ajuste POSTGRES_PORT no .env.",
        isDemo: true,
        status: "AVAILABLE",
      },
    });
  }
}

async function main() {
  const { admin, student } = await seedUsers();
  const importResult = await seedCurriculum();
  const lessons = await seedDemoLessons();
  await seedBadgeCatalog();
  await seedProjectAndLab();

  if (lessons) {
    await seedAssessment(lessons.welcomeLesson.id, lessons.program.name);
    await seedFlashcards({
      welcomeLessonId: lessons.welcomeLesson.id,
      principleLessonId: lessons.principleLesson.id,
    });
    await seedSkills({
      welcomeLessonId: lessons.welcomeLesson.id,
      principleLessonId: lessons.principleLesson.id,
    });
  }

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
