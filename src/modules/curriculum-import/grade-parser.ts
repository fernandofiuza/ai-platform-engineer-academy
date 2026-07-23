// Parser para Grade_Curricular.md — mesma filosofia do parser de Curso.md (âncoras de texto,
// não Markdown genérico), mas aqui o arquivo tem uma estrutura semi-regular: cada módulo começa
// com uma linha "🟦/🟩/🟨/🟥/🟪 MÓDULO N — Nome" ou "🟦/🟩/🟨/🟥/🟪 Nome" (trilhas sem número),
// seguida de disciplinas/tópicos e, opcionalmente, uma linha "Projeto" com a descrição do
// projeto do módulo. O bloco final "🏆 PROJETO FINAL" é tratado à parte (vira um Project, não
// semanas). Ver docs/CURRICULUM_IMPORT.md.

export type ParsedModule = {
  order: number;
  name: string;
  weight: number;
  projectDescription: string | null;
};

export type ParsedFinalProject = {
  title: string;
  description: string;
  components: string[];
};

export type GradeParseWarning = {
  excerpt: string;
  reason: string;
};

export type GradeParseResult = {
  modules: ParsedModule[];
  finalProject: ParsedFinalProject | null;
  warnings: GradeParseWarning[];
};

// Flag "u": os emojis de quadrado colorido (U+1F7E6+) estão fora do BMP (par substituto em
// UTF-16) — sem "u", a classe de caracteres casa metades de par substituto individualmente e
// corrompe a captura do nome do módulo.
const MODULE_HEADER_REGEX = /^[🟦🟩🟨🟥🟪]\s*(?:MÓDULO\s*\d+\s*—\s*)?(.+)$/u;
const FINAL_PROJECT_HEADER = "🏆 PROJETO FINAL";
const KNOWN_LABELS = new Set(["Disciplinas", "Objetivo", "Projeto"]);
const MIN_MODULE_WEIGHT = 4;

/**
 * Conta "linhas de tópico" dentro do bloco de um módulo: linhas que não terminam em "." (frases
 * de prosa terminam em ponto; nomes de tópicos/tecnologias, não) e que não são rótulos
 * conhecidos ("Disciplinas"/"Objetivo"/"Projeto"). Aplica um piso mínimo para módulos descritos
 * de forma muito resumida (ex.: "n8n — Tudo.") para não zerar o peso de tecnologias reais só
 * porque o texto-fonte é terso — ver docs/DECISIONS.md.
 */
function countTopicWeight(blockLines: string[]): number {
  const projetoIndex = blockLines.findIndex((line) => line === "Projeto");
  const contentLines = projetoIndex === -1 ? blockLines : blockLines.slice(0, projetoIndex);

  const topicLines = contentLines.filter(
    (line) => !line.endsWith(".") && !KNOWN_LABELS.has(line)
  );

  return Math.max(MIN_MODULE_WEIGHT, topicLines.length);
}

function extractProjectDescription(blockLines: string[]): string | null {
  const projetoIndex = blockLines.findIndex((line) => line === "Projeto");
  if (projetoIndex === -1) return null;
  const description = blockLines[projetoIndex + 1];
  return description ?? null;
}

function parseModules(normalized: string, warnings: GradeParseWarning[]): ParsedModule[] {
  const finalProjectIndex = normalized.indexOf(FINAL_PROJECT_HEADER);
  const searchArea = finalProjectIndex === -1 ? normalized : normalized.slice(0, finalProjectIndex);

  const lines = searchArea.split("\n").map((l) => l.trim());

  const headerIndexes: { lineIndex: number; name: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(MODULE_HEADER_REGEX);
    if (match) {
      headerIndexes.push({ lineIndex: i, name: match[1].trim() });
    }
  }

  if (headerIndexes.length === 0) {
    warnings.push({
      excerpt: "(início do arquivo)",
      reason: "Nenhum cabeçalho de módulo reconhecido em Grade_Curricular.md.",
    });
    return [];
  }

  const modules: ParsedModule[] = [];
  for (let i = 0; i < headerIndexes.length; i++) {
    const start = headerIndexes[i].lineIndex + 1;
    const end = i + 1 < headerIndexes.length ? headerIndexes[i + 1].lineIndex : lines.length;
    const blockLines = lines.slice(start, end).filter((l) => l.length > 0);

    modules.push({
      order: i,
      name: headerIndexes[i].name,
      weight: countTopicWeight(blockLines),
      projectDescription: extractProjectDescription(blockLines),
    });
  }

  return modules;
}

function parseFinalProject(normalized: string, warnings: GradeParseWarning[]): ParsedFinalProject | null {
  const startIndex = normalized.indexOf(FINAL_PROJECT_HEADER);
  if (startIndex === -1) {
    warnings.push({
      excerpt: FINAL_PROJECT_HEADER,
      reason: "Seção do Projeto Final não encontrada em Grade_Curricular.md.",
    });
    return null;
  }

  const endMarker = "📖 O que EU vou entregar";
  const endIndex = normalized.indexOf(endMarker, startIndex);
  const block = normalized.slice(
    startIndex + FINAL_PROJECT_HEADER.length,
    endIndex === -1 ? undefined : endIndex
  );

  const lines = block
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const descriptionLine = lines.find((l) => l.toLowerCase().includes("plataforma comercial"));
  const titleMatch = descriptionLine?.match(/chamada\s+([^.]+)\./);
  const title = titleMatch ? titleMatch[1].trim() : "APEX Academy";

  const listStartIndex = lines.findIndex((l) => l.toLowerCase().startsWith("ela será composta por"));
  const components =
    listStartIndex === -1
      ? []
      : lines.slice(listStartIndex + 1).filter((l) => !l.endsWith(":"));

  if (components.length === 0) {
    warnings.push({
      excerpt: endMarker,
      reason: "Lista de componentes do Projeto Final não encontrada ou vazia.",
    });
  }

  return {
    title,
    description: descriptionLine ?? `Construiremos uma plataforma comercial chamada ${title}.`,
    components,
  };
}

export function parseGradeCurricular(raw: string): GradeParseResult {
  const normalized = raw.replace(/\r\n/g, "\n");
  const warnings: GradeParseWarning[] = [];

  const modules = parseModules(normalized, warnings);
  const finalProject = parseFinalProject(normalized, warnings);

  return { modules, finalProject, warnings };
}
