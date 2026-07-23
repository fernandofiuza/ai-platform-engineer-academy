// Gera o conteúdo de 1 aula por semana a partir dos tópicos reais de cada módulo (extraídos por
// grade-parser.ts). Os tópicos do módulo são divididos em fatias contíguas entre as semanas do
// módulo (a mesma ordem do arquivo-fonte é preservada); a última semana do módulo recebe também
// a descrição do projeto. Módulos com menos tópicos do que semanas geram semanas de consolidação
// (sem tópicos novos, revisando o módulo inteiro). Ver docs/CURRICULUM_IMPORT.md.

import type { ModuleWeekRange } from "./grade-distribution";
import type { ParsedModule } from "./grade-parser";

export type WeekLessonContent = {
  weekNumber: number;
  title: string;
  objective: string;
  contentMarkdown: string;
};

function chunkTopics(topics: string[], weekCount: number): string[][] {
  if (weekCount <= 0) return [];
  if (topics.length === 0) return Array.from({ length: weekCount }, () => []);

  const base = Math.floor(topics.length / weekCount);
  const remainder = topics.length - base * weekCount;

  const chunks: string[][] = [];
  let cursor = 0;
  for (let i = 0; i < weekCount; i++) {
    const size = base + (i < remainder ? 1 : 0);
    chunks.push(topics.slice(cursor, cursor + size));
    cursor += size;
  }
  return chunks;
}

function buildContentMarkdown(params: {
  module: ParsedModule;
  weekNumber: number;
  topics: string[];
  isLastWeekOfModule: boolean;
}): string {
  const { module, weekNumber, topics, isLastWeekOfModule } = params;
  const isConsolidationWeek = topics.length === 0;
  // Módulos descritos de forma muito resumida (ex.: n8n, SaaS) não têm nenhuma linha de tópico
  // real — nesse caso o próprio nome do módulo é o único "tópico" disponível, para o checklist
  // nunca ficar vazio.
  const moduleTopicsOrName = module.topics.length > 0 ? module.topics : [module.name];
  const focusTopics = isConsolidationWeek ? moduleTopicsOrName : topics;

  const topicIntro = isConsolidationWeek
    ? `Esta semana consolida o módulo **${module.name}**, revisando o que já foi estudado:`
    : `Nesta semana, dentro do módulo **${module.name}**, o foco é:`;

  const studyLines = focusTopics
    .map(
      (topic) =>
        `- **${topic}** — pesquise o conceito, veja a documentação/referência oficial, entenda quando e por que se usa, e pratique um exemplo mínimo.`
    )
    .join("\n");

  const checklistLines = focusTopics
    .map((topic) => `- [ ] Consigo explicar e aplicar **${topic}** com minhas próprias palavras.`)
    .join("\n");

  const projectSection =
    isLastWeekOfModule && module.projectDescription
      ? `\n## 🏗️ Projeto do módulo\n\n${module.projectDescription}\n\nEsta é a semana de consolidar tudo o que foi estudado em **${module.name}** nesse projeto prático, aplicado à infraestrutura da AI Labs.\n`
      : "";

  return `# Semana ${weekNumber} — ${module.name}

## 🎯 Objetivo da semana

${topicIntro}

${studyLines}

## 📚 Como estudar

Siga o princípio da formação: nunca estudar uma tecnologia sem aplicá-la. Para cada tópico
acima, leia a documentação oficial, teste em um ambiente real (WSL2 ou o laboratório da AI Labs)
e registre em uma anotação o que aprendeu e o que ainda ficou pouco claro.

## 💻 Laboratório guiado

Aplique os tópicos desta semana em um exercício prático dentro do ambiente da AI Labs (ou no seu
próprio laboratório local), documentando os comandos e as decisões tomadas.

## 🏋️ Exercícios e desafio extra

Resolva pelo menos um exercício prático por tópico listado acima; se sobrar tempo, tente um
desafio extra combinando dois ou mais tópicos da semana.

## 🏗️ Como a AI Labs faria

Pense em como uma empresa real estruturaria isso em produção — não apenas "fazer funcionar", mas
com organização, documentação e revisão de código.
${projectSection}
## ✅ Checklist antes de avançar

${checklistLines}

---

> Conteúdo gerado a partir da grade curricular (\`Grade_Curricular.md\`): objetivo, tópicos reais
> da semana, laboratório e checklist prontos para uso. Explicações mais aprofundadas de cada
> tópico específico podem ser adicionadas/editadas pela área administrativa a qualquer momento.
`;
}

/** Gera 1 `WeekLessonContent` para cada semana da faixa (`range`) de um módulo. */
export function buildWeekLessons(range: ModuleWeekRange): WeekLessonContent[] {
  const { module } = range;
  const weekCount = range.endWeek - range.startWeek + 1;
  const chunks = chunkTopics(module.topics, weekCount);

  return chunks.map((topics, index) => {
    const weekNumber = range.startWeek + index;
    const isLastWeekOfModule = index === chunks.length - 1;

    const title =
      topics.length > 0
        ? `Semana ${weekNumber} — ${module.name}: ${topics.slice(0, 2).join(", ")}${topics.length > 2 ? "…" : ""}`
        : `Semana ${weekNumber} — ${module.name}: consolidação e projeto`;

    const objective =
      topics.length > 0
        ? `Estudar e aplicar: ${topics.join(", ")}.`
        : `Consolidar o módulo ${module.name}${module.projectDescription ? ` e avançar no projeto: ${module.projectDescription}` : "."}`;

    return {
      weekNumber,
      title,
      objective,
      contentMarkdown: buildContentMarkdown({ module, weekNumber, topics, isLastWeekOfModule }),
    };
  });
}
