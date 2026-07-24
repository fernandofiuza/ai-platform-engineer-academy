const DEFAULT_LESSON_MINUTES = 60;
const MAX_DAYS_TO_WALK = 5000;

export type ScheduledLesson = {
  lessonId: string;
  title: string;
  weekNumber: number;
  status: "completed" | "scheduled";
  date: Date;
  /** Posição da aula na ordem geral do currículo (0-based) — usada para agrupar em "semanas de
   * ritmo" (`paceWeekIndex`), nunca para exibição direta. */
  curriculumIndex: number;
  /** "Semana N" no sentido do RITMO do aluno: `floor(curriculumIndex / pace) + 1`, onde `pace` é
   * `StudyPlan.availableDays.length`. Deliberadamente independente de `Week.number` (a semana
   * fixa do currículo, sempre com o mesmo número de aulas) — é isso que faz "Semana 1" conter
   * exatamente `pace` aulas, qualquer que seja o ritmo configurado, em vez de sempre 5. Ver
   * `docs/DECISIONS.md`.
   */
  paceWeekIndex: number;
};

export type LessonScheduleResult = {
  items: ScheduledLesson[];
  completedCount: number;
  pendingCount: number;
  totalCount: number;
  /** Data prevista de conclusão (a última aula pendente agendada), ou null se não há pendências
   * ou se nenhum dia da semana está disponível para estudo. */
  forecastDate: Date | null;
  /** `StudyPlan.availableDays.length` no momento do cálculo — repetido aqui para que quem
   * consome o resultado não precise buscar o `StudyPlan` de novo só para saber o ritmo. */
  pace: number;
};

export type PaceWeekGroup = {
  index: number;
  items: ScheduledLesson[];
  startDate: Date;
  endDate: Date;
};

type LessonInput = {
  id: string;
  title: string;
  durationMinutes: number | null;
  week: { number: number };
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/**
 * Agenda dinamicamente as aulas pendentes do aluno nos próximos dias disponíveis, a partir de
 * hoje (nunca no passado) — nunca há um cronograma "fixo" persistido: cada chamada recalcula do
 * zero a partir do estado real (`LessonCompletion`) e da configuração atual (`StudyPlan`). Isso
 * já implementa sozinho o comportamento pedido pelo usuário:
 * - Aula não estudada em um dia disponível → continua pendente, "empurrada" para o próximo dia
 *   disponível na próxima chamada (a previsão de conclusão desliza para frente automaticamente).
 * - 2+ aulas concluídas no mesmo dia → a fila de pendentes encolhe mais rápido, então a próxima
 *   chamada precisa de menos dias futuros e a previsão de conclusão volta para trás.
 * Cada dia disponível recebe o máximo de aulas que caibam no orçamento de `dailyHours` (usando
 * `durationMinutes` de cada aula, com 60min como padrão quando não informado) — mas sempre pelo
 * menos 1 aula por dia disponível, mesmo que ela sozinha já estoure o orçamento diário.
 */
export function computeLessonSchedule(params: {
  lessons: LessonInput[];
  completions: Map<string, Date>;
  availableDays: number[];
  dailyHours: number;
  startDate: Date;
  today?: Date;
}): LessonScheduleResult {
  const { lessons, completions, availableDays, dailyHours, startDate } = params;
  const today = startOfDay(params.today ?? new Date());
  const pace = Math.max(availableDays.length, 1);

  const items: ScheduledLesson[] = [];
  const pending: { lesson: LessonInput; curriculumIndex: number }[] = [];

  lessons.forEach((lesson, curriculumIndex) => {
    const completedAt = completions.get(lesson.id);
    if (completedAt) {
      items.push({
        lessonId: lesson.id,
        title: lesson.title,
        weekNumber: lesson.week.number,
        status: "completed",
        date: completedAt,
        curriculumIndex,
        paceWeekIndex: Math.floor(curriculumIndex / pace) + 1,
      });
    } else {
      pending.push({ lesson, curriculumIndex });
    }
  });

  const completedCount = items.length;
  const totalCount = lessons.length;

  if (pending.length === 0 || availableDays.length === 0) {
    items.sort((a, b) => a.curriculumIndex - b.curriculumIndex);
    return {
      items,
      completedCount,
      pendingCount: pending.length,
      totalCount,
      forecastDate: null,
      pace,
    };
  }

  const dailyBudgetMinutes = Math.max(dailyHours, 0.5) * 60;
  let cursor = startOfDay(new Date(Math.max(startDate.getTime(), today.getTime())));

  let pendingIndex = 0;
  let forecastDate: Date | null = null;
  let daysWalked = 0;

  while (pendingIndex < pending.length && daysWalked < MAX_DAYS_TO_WALK) {
    daysWalked++;
    if (!availableDays.includes(cursor.getDay())) {
      cursor = addDays(cursor, 1);
      continue;
    }

    let minutesUsed = 0;
    let assignedAny = false;
    while (pendingIndex < pending.length) {
      const { lesson, curriculumIndex } = pending[pendingIndex];
      const duration = lesson.durationMinutes ?? DEFAULT_LESSON_MINUTES;
      if (assignedAny && minutesUsed + duration > dailyBudgetMinutes) break;

      items.push({
        lessonId: lesson.id,
        title: lesson.title,
        weekNumber: lesson.week.number,
        status: "scheduled",
        date: new Date(cursor),
        curriculumIndex,
        paceWeekIndex: Math.floor(curriculumIndex / pace) + 1,
      });
      minutesUsed += duration;
      assignedAny = true;
      pendingIndex++;
    }
    forecastDate = new Date(cursor);
    cursor = addDays(cursor, 1);
  }

  items.sort((a, b) => a.curriculumIndex - b.curriculumIndex);
  return { items, completedCount, pendingCount: pending.length, totalCount, forecastDate, pace };
}

/** Agrupa aulas já agendadas/concluídas em "semanas de ritmo" (`paceWeekIndex`) — cada grupo tem
 * exatamente `pace` aulas (o último grupo pode ter menos). Requer `items` na ordem do currículo
 * (garantido por `computeLessonSchedule`). */
export function groupByPaceWeek(items: ScheduledLesson[]): PaceWeekGroup[] {
  const groups = new Map<number, ScheduledLesson[]>();
  for (const item of items) {
    const bucket = groups.get(item.paceWeekIndex);
    if (bucket) bucket.push(item);
    else groups.set(item.paceWeekIndex, [item]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([index, groupItems]) => ({
      index,
      items: groupItems,
      startDate: groupItems.reduce((min, i) => (i.date < min ? i.date : min), groupItems[0].date),
      endDate: groupItems.reduce((max, i) => (i.date > max ? i.date : max), groupItems[0].date),
    }));
}
