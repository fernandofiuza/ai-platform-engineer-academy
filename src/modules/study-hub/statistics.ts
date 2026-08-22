import { db } from "@/lib/db";
import { addDays, startOfDay, startOfWeek } from "./queries";

const DAYS_WINDOW = 30;
const WEEKS_WINDOW = 12;

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shortLabel(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

/**
 * Tudo agregado em memória a partir dos dados já existentes (StudySession,
 * LessonCompletion, ExternalLesson, ExternalCourse) — sem SQL agregado, sem tabela
 * nova. Volume é pessoal (um único usuário), não precisa de otimização de banco.
 */
export async function getStudyHubStatistics(userId: string) {
  const now = new Date();
  const windowStart = addDays(startOfDay(now), -(DAYS_WINDOW - 1));
  const weeksWindowStart = addDays(startOfWeek(now), -7 * (WEEKS_WINDOW - 1));

  const [allSessions, nativeCompletions, externalLessons, externalCourses] = await Promise.all([
    db.studySession.findMany({
      where: { userId, endedAt: { not: null } },
      select: { startedAt: true, durationMinutes: true },
    }),
    db.lessonCompletion.findMany({ where: { userId }, select: { completedAt: true } }),
    db.externalLesson.findMany({
      where: { module: { course: { userId } } },
      select: { completed: true, completedAt: true },
    }),
    db.externalCourse.findMany({
      where: { userId },
      select: { status: true, modules: { select: { lessons: { select: { completed: true } } } } },
    }),
  ]);

  // --- tiles (histórico completo) ---
  const totalMinutes = allSessions.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
  const distinctDays = new Set(allSessions.map((s) => dateKey(s.startedAt))).size;
  const distinctWeeks = new Set(allSessions.map((s) => dateKey(startOfWeek(s.startedAt)))).size;
  const externalCompletedCount = externalLessons.filter((l) => l.completed).length;

  const courseProgressPercentages = externalCourses.map((course) => {
    const lessons = course.modules.flatMap((m) => m.lessons);
    if (lessons.length === 0) return 0;
    return (lessons.filter((l) => l.completed).length / lessons.length) * 100;
  });

  const tiles = {
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    totalLessonsCompleted: nativeCompletions.length + externalCompletedCount,
    externalCoursesCompleted: externalCourses.filter((c) => c.status === "COMPLETED").length,
    avgDailyMinutes: distinctDays > 0 ? Math.round(totalMinutes / distinctDays) : 0,
    avgWeeklyMinutes: distinctWeeks > 0 ? Math.round(totalMinutes / distinctWeeks) : 0,
    avgCourseProgress:
      courseProgressPercentages.length > 0
        ? Math.round(
            courseProgressPercentages.reduce((a, b) => a + b, 0) / courseProgressPercentages.length
          )
        : 0,
  };

  // --- séries pra gráfico (janela de 30 dias / 12 semanas) ---
  const minutesByDay = new Map<string, number>();
  const minutesByWeek = new Map<string, number>();
  for (const s of allSessions) {
    if (!s.durationMinutes) continue;
    const dKey = dateKey(s.startedAt);
    minutesByDay.set(dKey, (minutesByDay.get(dKey) ?? 0) + s.durationMinutes);
    const wKey = dateKey(startOfWeek(s.startedAt));
    minutesByWeek.set(wKey, (minutesByWeek.get(wKey) ?? 0) + s.durationMinutes);
  }

  const completionsByDay = new Map<string, number>();
  for (const c of nativeCompletions) {
    const k = dateKey(c.completedAt);
    completionsByDay.set(k, (completionsByDay.get(k) ?? 0) + 1);
  }
  for (const l of externalLessons) {
    if (!l.completed || !l.completedAt) continue;
    const k = dateKey(l.completedAt);
    completionsByDay.set(k, (completionsByDay.get(k) ?? 0) + 1);
  }

  const dayList = Array.from({ length: DAYS_WINDOW }, (_, i) => addDays(windowStart, i));
  const weekList = Array.from({ length: WEEKS_WINDOW }, (_, i) => addDays(weeksWindowStart, i * 7));

  const hoursPerDay = dayList.map((d) => ({
    label: shortLabel(d),
    value: Math.round(((minutesByDay.get(dateKey(d)) ?? 0) / 60) * 10) / 10,
  }));
  const hoursPerWeek = weekList.map((d) => ({
    label: shortLabel(d),
    value: Math.round(((minutesByWeek.get(dateKey(d)) ?? 0) / 60) * 10) / 10,
  }));
  const lessonsPerDay = dayList.map((d) => ({
    label: shortLabel(d),
    value: completionsByDay.get(dateKey(d)) ?? 0,
  }));

  const completedBeforeWindow =
    nativeCompletions.filter((c) => c.completedAt < windowStart).length +
    externalLessons.filter((l) => l.completed && l.completedAt && l.completedAt < windowStart).length;
  let running = completedBeforeWindow;
  const progressEvolution = dayList.map((d) => {
    running += completionsByDay.get(dateKey(d)) ?? 0;
    return { label: shortLabel(d), value: running };
  });

  return { tiles, hoursPerDay, hoursPerWeek, lessonsPerDay, progressEvolution };
}
