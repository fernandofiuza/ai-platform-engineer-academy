type IcsLessonItem = {
  lessonId: string;
  title: string;
  date: Date;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toIcsDate(date: Date): string {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function toIcsDateTimeUtc(date: Date): string {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(
    date.getUTCHours()
  )}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** RFC 5545: linhas de conteúdo não podem passar de 75 octets; a continuação começa com 1 espaço. */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 0) {
    chunks.push(rest.slice(0, 74));
    rest = rest.slice(74);
  }
  return chunks.join("\r\n ");
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/**
 * Gera um arquivo `.ics` (RFC 5545) com 1 evento de dia inteiro por aula agendada, pra importar
 * no Google/Outlook/Apple Calendar. O cronograma do Planejador é dinâmico e nunca persistido
 * (`computeLessonSchedule`), então este arquivo é sempre uma fotografia do momento do download —
 * reimportar depois de reconfigurar o Planejador substitui os eventos antigos (mesmo `UID` por
 * aula, a maioria dos calendários atualiza em vez de duplicar).
 */
export function buildPlannerIcs(items: IcsLessonItem[], baseUrl: string): string {
  const now = toIcsDateTimeUtc(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AI Platform Engineer Academy//Planejador//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Cronograma de estudos",
  ];

  for (const item of items) {
    const lessonUrl = `${baseUrl}/learn/${item.lessonId}`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:lesson-${item.lessonId}@ai-platform-engineer-academy`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${toIcsDate(item.date)}`,
      `DTEND;VALUE=DATE:${toIcsDate(addDays(item.date, 1))}`,
      `SUMMARY:${escapeIcsText(item.title)}`,
      `DESCRIPTION:${escapeIcsText(`Abrir a aula: ${lessonUrl}`)}`,
      `URL:${lessonUrl}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
