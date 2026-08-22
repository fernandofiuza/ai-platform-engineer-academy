import type { ExternalLesson, ExternalModule } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getStudyPlan } from "@/modules/planning/queries";
import { getSessionsInRange } from "@/modules/study-sessions/queries";

export type ExternalModuleTree = ExternalModule & {
  lessons: ExternalLesson[];
  modules: ExternalModuleTree[];
};

/** Remonta a árvore de módulos em memória a partir de listas planas — Prisma não suporta
 * `include` recursivo de profundidade arbitrária, então busco tudo achatado (uma query pros
 * módulos do curso, outra pras aulas) e agrupo por `parentModuleId`/`moduleId` aqui. */
function buildModuleTree(modules: ExternalModule[], lessons: ExternalLesson[]): ExternalModuleTree[] {
  const lessonsByModule = new Map<string, ExternalLesson[]>();
  for (const lesson of lessons) {
    const arr = lessonsByModule.get(lesson.moduleId) ?? [];
    arr.push(lesson);
    lessonsByModule.set(lesson.moduleId, arr);
  }
  for (const arr of lessonsByModule.values()) arr.sort((a, b) => a.order - b.order);

  const childrenByParent = new Map<string | null, ExternalModule[]>();
  for (const mod of modules) {
    const key = mod.parentModuleId;
    const arr = childrenByParent.get(key) ?? [];
    arr.push(mod);
    childrenByParent.set(key, arr);
  }
  for (const arr of childrenByParent.values()) arr.sort((a, b) => a.order - b.order);

  function build(parentId: string | null): ExternalModuleTree[] {
    return (childrenByParent.get(parentId) ?? []).map((mod) => ({
      ...mod,
      lessons: lessonsByModule.get(mod.id) ?? [],
      modules: build(mod.id),
    }));
  }

  return build(null);
}

/** Percorre a árvore em profundidade (mesma ordem em que o checklist exibe módulo → aulas →
 * submódulos), gerando a lista plana usada pra navegação "próxima/anterior aula". */
function flattenLessons(tree: ExternalModuleTree[]): ExternalLesson[] {
  const result: ExternalLesson[] = [];
  for (const mod of tree) {
    result.push(...mod.lessons);
    result.push(...flattenLessons(mod.modules));
  }
  return result;
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, days: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

/** Semana começando na segunda-feira (a semana de estudo em si é sempre seg-dom,
 * independente do rótulo de dia usado em `planning/format.ts`). */
export function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(startOfDay(d), diff);
}

/** Reaproveita `StudyPlan.dailyHours`/`availableDays` (já editável em `/planner`) como meta
 * de minutos — sem tabela nova. Retorna `null` se o usuário ainda não configurou um plano. */
export async function getGoalProgress(userId: string) {
  const plan = await getStudyPlan(userId);
  if (!plan) return null;

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = addDays(todayStart, 1);
  const weekStart = startOfWeek(now);
  const weekEnd = addDays(weekStart, 7);

  const [todaySessions, weekSessions] = await Promise.all([
    getSessionsInRange(userId, todayStart, todayEnd),
    getSessionsInRange(userId, weekStart, weekEnd),
  ]);

  const sumMinutes = (sessions: { durationMinutes: number | null }[]) =>
    sessions.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);

  const dailyTargetMinutes = Math.round(plan.dailyHours * 60);
  const weeklyTargetMinutes = dailyTargetMinutes * Math.max(plan.availableDays.length, 1);

  return {
    dailyTargetMinutes,
    dailyActualMinutes: sumMinutes(todaySessions),
    weeklyTargetMinutes,
    weeklyActualMinutes: sumMinutes(weekSessions),
  };
}

/** Reaproveitada pelo dashboard principal (aulas concluídas) e pelo Study Hub (continuar
 * estudando) — mesma base de cálculo (LessonCompletion / Lesson disponíveis), num só lugar. */
export async function getNativeCurriculumProgress(userId: string) {
  const [totalLessons, completedLessons] = await Promise.all([
    db.lesson.count({ where: { status: "AVAILABLE" } }),
    db.lessonCompletion.count({ where: { userId } }),
  ]);
  const progressPercent =
    totalLessons > 0 ? Math.round((Math.min(completedLessons, totalLessons) / totalLessons) * 100) : 0;
  return { totalLessons, completedLessons, progressPercent };
}

export async function isLessonMarkedForReview(userId: string, lessonId: string) {
  const mark = await db.lessonReviewMark.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });
  return mark !== null;
}

export async function getReviewItems(userId: string) {
  const nativeMarks = await db.lessonReviewMark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { lesson: { include: { week: true } } },
  });

  const nativeItems = nativeMarks.map((mark) => ({
    type: "native" as const,
    id: mark.lesson.id,
    title: mark.lesson.title,
    contextLabel: `Semana ${mark.lesson.week.number}`,
    href: `/learn/${mark.lesson.id}`,
    markedAt: mark.createdAt,
  }));

  const externalLessons = await db.externalLesson.findMany({
    where: { markedForReview: true, module: { course: { userId } } },
    orderBy: { updatedAt: "desc" },
    include: { module: { include: { course: true } } },
  });

  const externalItems = externalLessons.map((lesson) => ({
    type: "external" as const,
    id: lesson.id,
    title: lesson.title,
    contextLabel: lesson.module.course.title,
    href: `/study-hub/courses/${lesson.module.courseId}/lessons/${lesson.id}`,
    markedAt: lesson.updatedAt,
  }));

  return [...nativeItems, ...externalItems].sort(
    (a, b) => b.markedAt.getTime() - a.markedAt.getTime()
  );
}

export async function getContinueStudying(userId: string) {
  const [lastCompletion, lastSession, lastExternalLesson] = await Promise.all([
    db.lessonCompletion.findFirst({
      where: { userId },
      orderBy: { completedAt: "desc" },
      include: { lesson: { include: { week: true } } },
    }),
    db.studySession.findFirst({
      where: { userId, lessonId: { not: null } },
      orderBy: { startedAt: "desc" },
      include: { lesson: { include: { week: true } } },
    }),
    db.externalLesson.findFirst({
      where: {
        module: { course: { userId } },
        OR: [{ lastAccessedAt: { not: null } }, { completed: true }],
      },
      orderBy: [{ lastAccessedAt: "desc" }, { completedAt: "desc" }],
      include: { module: { include: { course: true } } },
    }),
  ]);

  const nativeCandidates = [
    lastCompletion ? { at: lastCompletion.completedAt, lesson: lastCompletion.lesson } : null,
    lastSession?.lesson ? { at: lastSession.startedAt, lesson: lastSession.lesson } : null,
  ].filter((c): c is { at: Date; lesson: NonNullable<typeof lastCompletion>["lesson"] } => c !== null);

  const bestNative = nativeCandidates.sort((a, b) => b.at.getTime() - a.at.getTime())[0] ?? null;
  const bestExternalAt = lastExternalLesson?.lastAccessedAt ?? lastExternalLesson?.completedAt ?? null;

  const useNative =
    bestNative && (!bestExternalAt || bestNative.at.getTime() >= bestExternalAt.getTime());

  if (useNative && bestNative) {
    const { progressPercent } = await getNativeCurriculumProgress(userId);
    return {
      type: "native" as const,
      title: bestNative.lesson.title,
      contextLabel: `Semana ${bestNative.lesson.week.number}`,
      href: `/learn/${bestNative.lesson.id}`,
      progressPercent,
    };
  }

  if (lastExternalLesson) {
    const siblingLessons = await db.externalLesson.findMany({
      where: { module: { courseId: lastExternalLesson.module.courseId } },
      select: { completed: true },
    });
    const total = siblingLessons.length;
    const completed = siblingLessons.filter((l) => l.completed).length;
    return {
      type: "external" as const,
      title: lastExternalLesson.title,
      contextLabel: lastExternalLesson.module.course.title,
      href: `/study-hub/courses/${lastExternalLesson.module.courseId}/lessons/${lastExternalLesson.id}`,
      progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  return null;
}

export async function getStudyHubOverviewStats(userId: string) {
  const [coursesInProgress, totalExternalLessons, completedExternalLessons, reviewCount] =
    await Promise.all([
      db.externalCourse.count({ where: { userId, status: "IN_PROGRESS" } }),
      db.externalLesson.count({ where: { module: { course: { userId } } } }),
      db.externalLesson.count({ where: { module: { course: { userId } }, completed: true } }),
      db.lessonReviewMark.count({ where: { userId } }).then(async (nativeCount) => {
        const externalCount = await db.externalLesson.count({
          where: { module: { course: { userId } }, markedForReview: true },
        });
        return nativeCount + externalCount;
      }),
    ]);

  return { coursesInProgress, totalExternalLessons, completedExternalLessons, reviewCount };
}

export async function searchStudyHub(userId: string, query: string) {
  const q = query.trim();
  if (q.length < 2) return { nativeLessons: [], externalLessons: [] };

  const [nativeLessons, externalLessons] = await Promise.all([
    db.lesson.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      include: { week: true },
      take: 10,
    }),
    db.externalLesson.findMany({
      where: { title: { contains: q, mode: "insensitive" }, module: { course: { userId } } },
      include: { module: { include: { course: true } } },
      take: 10,
    }),
  ]);

  return {
    nativeLessons: nativeLessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      contextLabel: `Semana ${lesson.week.number}`,
      href: `/learn/${lesson.id}`,
    })),
    externalLessons: externalLessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      contextLabel: lesson.module.course.title,
      href: `/study-hub/courses/${lesson.module.courseId}/lessons/${lesson.id}`,
    })),
  };
}

export async function getExternalCourses(userId: string) {
  const courses = await db.externalCourse.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  const courseIds = courses.map((c) => c.id);

  // Conta aulas direto por `lesson.module.courseId` (presente em todo módulo, raiz ou aninhado)
  // em vez de atravessar `course.modules[].lessons` — assim funciona em qualquer profundidade
  // de submódulo sem precisar remontar a árvore inteira só pra contar.
  const lessons =
    courseIds.length > 0
      ? await db.externalLesson.findMany({
          where: { module: { courseId: { in: courseIds } } },
          select: { completed: true, module: { select: { courseId: true } } },
        })
      : [];

  const statsByCourse = new Map<string, { total: number; completed: number }>();
  for (const lesson of lessons) {
    const stat = statsByCourse.get(lesson.module.courseId) ?? { total: 0, completed: 0 };
    stat.total += 1;
    if (lesson.completed) stat.completed += 1;
    statsByCourse.set(lesson.module.courseId, stat);
  }

  return courses.map((course) => {
    const stat = statsByCourse.get(course.id) ?? { total: 0, completed: 0 };
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      platform: course.platform,
      instructor: course.instructor,
      url: course.url,
      category: course.category,
      status: course.status,
      totalLessons: stat.total,
      completedLessons: stat.completed,
      progressPercent: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0,
    };
  });
}

export async function getExternalCourseDetail(userId: string, courseId: string) {
  const course = await db.externalCourse.findUnique({ where: { id: courseId } });
  if (!course || course.userId !== userId) return null;

  const [modules, lessons] = await Promise.all([
    db.externalModule.findMany({ where: { courseId } }),
    db.externalLesson.findMany({ where: { module: { courseId } } }),
  ]);

  const moduleTree = buildModuleTree(modules, lessons);
  const totalLessons = lessons.length;
  const completedLessons = lessons.filter((l) => l.completed).length;

  return {
    course: { ...course, modules: moduleTree },
    totalLessons,
    completedLessons,
    progressPercent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
  };
}

export async function getExternalLessonDetail(userId: string, lessonId: string) {
  const lesson = await db.externalLesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: true } } },
  });
  if (!lesson || lesson.module.course.userId !== userId) return null;

  const courseId = lesson.module.courseId;
  const [modules, lessons] = await Promise.all([
    db.externalModule.findMany({ where: { courseId } }),
    db.externalLesson.findMany({ where: { module: { courseId } } }),
  ]);

  const flatLessons = flattenLessons(buildModuleTree(modules, lessons));
  const index = flatLessons.findIndex((l) => l.id === lessonId);
  const prev = index > 0 ? flatLessons[index - 1] : null;
  const next = index >= 0 && index < flatLessons.length - 1 ? flatLessons[index + 1] : null;

  return {
    lesson,
    module: lesson.module,
    course: lesson.module.course,
    prev,
    next,
  };
}
