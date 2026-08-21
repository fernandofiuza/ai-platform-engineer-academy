import type { ExternalCourseStatus } from "@/generated/prisma/enums";

export const EXTERNAL_COURSE_STATUS_LABELS: Record<ExternalCourseStatus, string> = {
  NOT_STARTED: "Não iniciado",
  IN_PROGRESS: "Em andamento",
  PAUSED: "Pausado",
  COMPLETED: "Concluído",
};

export const EXTERNAL_COURSE_STATUS_BADGE_VARIANT: Record<
  ExternalCourseStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  NOT_STARTED: "outline",
  IN_PROGRESS: "default",
  PAUSED: "secondary",
  COMPLETED: "default",
};
