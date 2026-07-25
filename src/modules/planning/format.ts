const WEEKDAY_LONG = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Formata uma data do cronograma dinâmico de forma consistente em todas as telas (Planejador,
 * Roadmap, Aprender) — sempre a mesma fonte (`computeLessonSchedule`), sempre o mesmo formato. */
export function formatScheduleDate(date: Date, style: "long" | "short" = "short"): string {
  if (style === "long") {
    const day = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    return `${day} (${WEEKDAY_LONG[date.getDay()]})`;
  }
  const day = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return `${day} (${WEEKDAY_SHORT[date.getDay()]})`;
}

export function formatDateRange(start: Date, end: Date): string {
  if (start.getTime() === end.getTime()) return formatScheduleDate(start);
  const startStr = start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const endStr = end.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return `${startStr}–${endStr}`;
}

/**
 * Remove o prefixo "Semana N" / "Semana N, Dia M — " gravado literalmente no título da aula na
 * importação (`grade-lessons.ts`) — esse texto se refere à semana FIXA do currículo (sempre 5
 * aulas). Títulos que não seguem esse padrão (ex.: as aulas de demonstração da Semana 0) voltam
 * inalterados. Ver `docs/DECISIONS.md`.
 */
export function stripWeekDayPrefix(title: string): string {
  return title.replace(/^Semana\s+\d+(?:,\s*Dia\s+\d+)?\s*—\s*/, "");
}

/**
 * Mesma limpeza de `stripWeekDayPrefix`, mas para o cabeçalho Markdown (`# Semana N, Dia M — ...`)
 * que o gerador de conteúdo por IA reproduz porque recebia o título bruto da aula como tema do
 * prompt (`buildLessonGenerationMessage`). Só afeta a primeira linha, quando ela é um heading
 * `#`; o resto do conteúdo não é tocado. Ver `docs/DECISIONS.md`.
 */
export function stripWeekDayHeading(markdown: string): string {
  return markdown.replace(/^(#\s+)Semana\s+\d+(?:,\s*Dia\s+\d+)?\s*—\s*/, "$1");
}

/**
 * "Dia N" sequencial do cronograma do aluno — `curriculumIndex + 1` (1-based), zero-padded a 2
 * dígitos. Substitui por completo o conceito de "Semana N" (fixa do currículo ou por ritmo) na
 * exibição do Planejador/Roadmap/Aprender, a pedido explícito do usuário — sem agrupamento por
 * semana, só a contagem sequencial de dias de estudo. Ver `docs/DECISIONS.md`.
 */
export function formatDayNumber(curriculumIndex: number): string {
  return `Dia ${String(curriculumIndex + 1).padStart(2, "0")}`;
}

/**
 * Converte o valor de um `<input type="date">` ("YYYY-MM-DD") para meia-noite no fuso LOCAL.
 * `new Date("YYYY-MM-DD")` (string "date-only") é interpretado como UTC pelo padrão ECMAScript —
 * em fusos atrás de UTC (ex.: Brasil, UTC-3), isso vira o dia anterior quando depois truncado em
 * hora local (`startOfDay`, usado por `computeLessonSchedule`), fazendo o cronograma começar um
 * dia antes da data escolhida no Planejador. Ver `docs/DECISIONS.md`.
 */
export function parseDateInputValue(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Inverso de `parseDateInputValue`: formata uma `Date` para o valor esperado por
 * `<input type="date">`, usando os componentes de data LOCAIS — nunca `toISOString()`, que
 * converte para UTC e pode voltar um dia em fusos à frente de UTC. */
export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
