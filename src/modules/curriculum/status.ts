import type { ContentStatus } from "@/generated/prisma/enums";

export const STATUS_LABELS: Record<ContentStatus, string> = {
  DRAFT: "Rascunho",
  PLANNED: "Planejado",
  AVAILABLE: "Disponível",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
  ARCHIVED: "Arquivado",
};

export const STATUS_BADGE_VARIANT: Record<
  ContentStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  DRAFT: "outline",
  PLANNED: "secondary",
  AVAILABLE: "default",
  IN_PROGRESS: "default",
  COMPLETED: "default",
  ARCHIVED: "outline",
};
