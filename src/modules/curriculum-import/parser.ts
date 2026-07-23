// Parser pragmático para Curso.md — o arquivo é uma transcrição de conversa (sem headings
// Markdown reais), não um documento estruturado. Em vez de tentar um parser genérico de
// Markdown (frágil para esse formato), extraímos apenas os trechos com estrutura reconhecível
// e ancorada em texto literal. Tudo que não bate com uma âncora conhecida vira ImportWarning —
// nunca é inventado. Ver docs/CURRICULUM_IMPORT.md.

export type ParsedProgram = {
  name: string;
  subtitle: string | null;
  durationMonths: number;
  totalWeeks: number;
  weeklyDays: number;
  dailyHours: number;
};

export type ParsedPhase = {
  order: number;
  name: string;
};

export type ParsedChecklistItem = {
  category: string;
  label: string;
  order: number;
};

export type ParseWarning = {
  excerpt: string;
  reason: string;
  targetEntityHint?: string;
};

export type ParseResult = {
  program: ParsedProgram;
  phases: ParsedPhase[];
  checklistItems: ParsedChecklistItem[];
  warnings: ParseWarning[];
};

const DEFAULT_PROGRAM: ParsedProgram = {
  name: "AI Platform Engineer Academy",
  subtitle: "Da Infraestrutura à Inteligência Artificial",
  durationMonths: 24,
  totalWeeks: 104,
  weeklyDays: 5,
  dailyHours: 3.5,
};

const CHECKLIST_CATEGORIES = [
  "Sistema",
  "IDE",
  "IA",
  "Versionamento",
  "Terminal",
  "Docker",
  "Navegadores",
  "Banco",
  "API",
  "Desenvolvimento",
  "Diagramas",
  "Documentação",
];

function parseProgram(raw: string, warnings: ParseWarning[]): ParsedProgram {
  const anchors: [string, string][] = [
    [DEFAULT_PROGRAM.name, "Program.name"],
    [DEFAULT_PROGRAM.subtitle!, "Program.subtitle"],
    ["24 meses", "Program.durationMonths"],
    ["104 semanas", "Program.totalWeeks"],
    ["5 dias por semana", "Program.weeklyDays"],
    ["3h30 por dia", "Program.dailyHours"],
  ];

  for (const [anchor, hint] of anchors) {
    if (!raw.includes(anchor)) {
      warnings.push({
        excerpt: anchor,
        reason: `Trecho esperado não encontrado em Curso.md: "${anchor}". Mantendo o último valor conhecido; revise manualmente.`,
        targetEntityHint: hint,
      });
    }
  }

  return { ...DEFAULT_PROGRAM };
}

function parsePhases(raw: string, warnings: ParseWarning[]): ParsedPhase[] {
  const phases: ParsedPhase[] = [];
  const regex = /(\d)º\s+Semestre\s*\r?\n\s*([^\r\n]+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(raw)) !== null) {
    phases.push({ order: Number(match[1]), name: match[2].trim() });
  }

  if (phases.length !== 6) {
    warnings.push({
      excerpt: `${phases.length} semestre(s) encontrado(s)`,
      reason: "Esperava encontrar 6 semestres nomeados ('1º Semestre' … '6º Semestre'). Revise a estrutura de fases manualmente.",
      targetEntityHint: "Phase",
    });
  }

  return phases;
}

function parseChecklist(raw: string, warnings: ParseWarning[]): ParsedChecklistItem[] {
  const startMarker = "Instalaremos e configuraremos:";
  const endMarker = "\nDepois\n";

  const startIndex = raw.indexOf(startMarker);
  if (startIndex === -1) {
    warnings.push({
      excerpt: startMarker,
      reason: "Bloco da Semana 0 (checklist de preparação do ambiente) não encontrado.",
      targetEntityHint: "ChecklistItem",
    });
    return [];
  }

  const endIndex = raw.indexOf(endMarker, startIndex);
  const block = raw.slice(
    startIndex + startMarker.length,
    endIndex === -1 ? undefined : endIndex
  );

  const lines = block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const items: ParsedChecklistItem[] = [];
  let currentCategory: string | null = null;
  let order = 0;
  const leftover: string[] = [];

  for (const line of lines) {
    if (CHECKLIST_CATEGORIES.includes(line)) {
      currentCategory = line;
      continue;
    }

    const label = line.replace(/^✅\s*/, "").trim();

    if (!currentCategory) {
      leftover.push(line);
      continue;
    }

    items.push({ category: currentCategory, label, order: order++ });
  }

  if (leftover.length > 0) {
    warnings.push({
      excerpt: leftover.join(" / "),
      reason: "Linha(s) da Semana 0 encontradas antes de qualquer categoria conhecida — não foram associadas a nenhum item.",
      targetEntityHint: "ChecklistItem",
    });
  }

  const foundCategories = new Set(items.map((item) => item.category));
  for (const category of CHECKLIST_CATEGORIES) {
    if (!foundCategories.has(category)) {
      warnings.push({
        excerpt: category,
        reason: `Categoria esperada "${category}" não encontrada no bloco da Semana 0.`,
        targetEntityHint: "ChecklistItem",
      });
    }
  }

  return items;
}

export function parseCursoMarkdown(raw: string): ParseResult {
  // Normaliza quebras de linha (Curso.md usa CRLF) para que as âncoras literais com "\n"
  // funcionem de forma previsível.
  const normalized = raw.replace(/\r\n/g, "\n");

  const warnings: ParseWarning[] = [];
  const program = parseProgram(normalized, warnings);
  const phases = parsePhases(normalized, warnings);
  const checklistItems = parseChecklist(normalized, warnings);

  return { program, phases, checklistItems, warnings };
}
