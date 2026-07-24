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
