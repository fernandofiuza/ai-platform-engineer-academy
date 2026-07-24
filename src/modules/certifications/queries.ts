import { db } from "@/lib/db";
import { PROGRAM_SLUG } from "@/modules/curriculum-import/service";

export type CertificationEligibility = {
  phase: { id: string; order: number; name: string; label: string };
  requiredLessons: number;
  completedLessons: number;
  weeksComplete: boolean;
  hasFinalProject: boolean;
  projectDone: boolean;
  hasFinalAssessment: boolean;
  assessmentDone: boolean;
  eligible: boolean;
};

/**
 * Verifica os 3 requisitos da certificação de fase (Etapa 8): todas as semanas obrigatórias
 * da fase concluídas (aulas disponíveis com `LessonCompletion`), o projeto final da fase
 * (`Phase.finalProject`) submetido com `status = DONE`, e a avaliação final da fase
 * (`Phase.finalAssessment`) com ao menos uma tentativa enviada. Se o projeto/avaliação final
 * ainda não tiver sido definido pela área administrativa, o requisito correspondente nunca é
 * satisfeito (não inventamos o que ainda não existe) — ver docs/DECISIONS.md.
 */
export async function getCertificationEligibility(
  userId: string,
  phaseId: string
): Promise<CertificationEligibility | null> {
  const phase = await db.phase.findUnique({
    where: { id: phaseId },
    include: {
      weeks: {
        where: { isEnvironmentSetup: false },
        include: { lessons: { where: { status: "AVAILABLE" } } },
      },
    },
  });
  if (!phase) return null;

  const requiredLessonIds = phase.weeks.flatMap((w) => w.lessons.map((l) => l.id));
  const completedLessons =
    requiredLessonIds.length > 0
      ? await db.lessonCompletion.count({ where: { userId, lessonId: { in: requiredLessonIds } } })
      : 0;
  const weeksComplete = requiredLessonIds.length > 0 && completedLessons >= requiredLessonIds.length;

  let projectDone = false;
  if (phase.finalProjectId) {
    const submission = await db.projectSubmission.findUnique({
      where: { userId_projectId: { userId, projectId: phase.finalProjectId } },
    });
    projectDone = submission?.status === "DONE";
  }

  let assessmentDone = false;
  if (phase.finalAssessmentId) {
    const attempt = await db.assessmentAttempt.findFirst({
      where: { userId, assessmentId: phase.finalAssessmentId, submittedAt: { not: null } },
    });
    assessmentDone = Boolean(attempt);
  }

  const hasFinalProject = Boolean(phase.finalProjectId);
  const hasFinalAssessment = Boolean(phase.finalAssessmentId);

  return {
    phase: { id: phase.id, order: phase.order, name: phase.name, label: phase.label },
    requiredLessons: requiredLessonIds.length,
    completedLessons,
    weeksComplete,
    hasFinalProject,
    projectDone,
    hasFinalAssessment,
    assessmentDone,
    eligible: weeksComplete && hasFinalProject && projectDone && hasFinalAssessment && assessmentDone,
  };
}

export async function getPhasesWithCertificationOverview(userId: string) {
  const program = await db.program.findUnique({
    where: { slug: PROGRAM_SLUG },
    include: { phases: { orderBy: { order: "asc" } } },
  });
  if (!program) return [];

  const certifications = await db.certification.findMany({ where: { userId } });
  const certByPhase = new Map(certifications.map((c) => [c.phaseId, c]));

  const overview = [];
  for (const phase of program.phases) {
    const eligibility = await getCertificationEligibility(userId, phase.id);
    overview.push({
      phase,
      certification: certByPhase.get(phase.id) ?? null,
      eligibility,
    });
  }
  return overview;
}

export async function getCertificationById(id: string) {
  return db.certification.findUnique({
    where: { id },
    include: { phase: { include: { program: true } }, user: { select: { name: true } } },
  });
}

export async function getAllAssessmentsForAdmin() {
  return db.assessment.findMany({
    include: { lesson: { select: { title: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getPhasesForAdminCertification() {
  const program = await db.program.findUnique({ where: { slug: PROGRAM_SLUG } });
  if (!program) return [];
  return db.phase.findMany({
    where: { programId: program.id },
    orderBy: { order: "asc" },
    include: { finalProject: true, finalAssessment: { include: { lesson: true } } },
  });
}
