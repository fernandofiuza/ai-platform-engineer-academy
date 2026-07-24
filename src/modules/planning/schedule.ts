const DEFAULT_LESSON_MINUTES = 60;
const MAX_DAYS_TO_WALK = 5000;

export type ScheduledLesson = {
  lessonId: string;
  title: string;
  weekNumber: number;
  status: "completed" | "scheduled";
  date: Date;
};

export type LessonScheduleResult = {
  items: ScheduledLesson[];
  completedCount: number;
  pendingCount: number;
  totalCount: number;
  /** Data prevista de conclusão (a última aula pendente agendada), ou null se não há pendências
   * ou se nenhum dia da semana está disponível para estudo. */
  forecastDate: Date | null;
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

  const items: ScheduledLesson[] = [];
  const pending: LessonInput[] = [];

  for (const lesson of lessons) {
    const completedAt = completions.get(lesson.id);
    if (completedAt) {
      items.push({
        lessonId: lesson.id,
        title: lesson.title,
        weekNumber: lesson.week.number,
        status: "completed",
        date: completedAt,
      });
    } else {
      pending.push(lesson);
    }
  }

  const completedCount = items.length;
  const totalCount = lessons.length;

  if (pending.length === 0 || availableDays.length === 0) {
    return {
      items,
      completedCount,
      pendingCount: pending.length,
      totalCount,
      forecastDate: null,
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
      const lesson = pending[pendingIndex];
      const duration = lesson.durationMinutes ?? DEFAULT_LESSON_MINUTES;
      if (assignedAny && minutesUsed + duration > dailyBudgetMinutes) break;

      items.push({
        lessonId: lesson.id,
        title: lesson.title,
        weekNumber: lesson.week.number,
        status: "scheduled",
        date: new Date(cursor),
      });
      minutesUsed += duration;
      assignedAny = true;
      pendingIndex++;
    }
    forecastDate = new Date(cursor);
    cursor = addDays(cursor, 1);
  }

  return { items, completedCount, pendingCount: pending.length, totalCount, forecastDate };
}
