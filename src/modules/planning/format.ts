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
 * aulas), e fica incoerente ao lado da numeração por ritmo (`paceWeekIndex`), que pode agrupar
 * um número diferente de aulas por "semana". Títulos que não seguem esse padrão (ex.: as aulas
 * de demonstração da Semana 0) voltam inalterados. Ver `docs/DECISIONS.md`.
 */
export function stripWeekDayPrefix(title: string): string {
  return title.replace(/^Semana\s+\d+(?:,\s*Dia\s+\d+)?\s*—\s*/, "");
}
