import { db } from "@/lib/db";

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
    include: {
      modules: {
        select: { lessons: { select: { completed: true } } },
      },
    },
  });

  return courses.map((course) => {
    const lessons = course.modules.flatMap((m) => m.lessons);
    const totalLessons = lessons.length;
    const completedLessons = lessons.filter((l) => l.completed).length;
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      platform: course.platform,
      instructor: course.instructor,
      url: course.url,
      category: course.category,
      status: course.status,
      totalLessons,
      completedLessons,
      progressPercent:
        totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    };
  });
}

export async function getExternalCourseDetail(userId: string, courseId: string) {
  const course = await db.externalCourse.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!course || course.userId !== userId) return null;

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const totalLessons = allLessons.length;
  const completedLessons = allLessons.filter((l) => l.completed).length;

  return {
    course,
    totalLessons,
    completedLessons,
    progressPercent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
  };
}

export async function getExternalLessonDetail(userId: string, lessonId: string) {
  const lesson = await db.externalLesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: {
            include: {
              modules: {
                orderBy: { order: "asc" },
                include: { lessons: { orderBy: { order: "asc" } } },
              },
            },
          },
        },
      },
    },
  });
  if (!lesson || lesson.module.course.userId !== userId) return null;

  const flatLessons = lesson.module.course.modules.flatMap((m) => m.lessons);
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
