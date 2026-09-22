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
  "default" | "secondary" | "outline" | "destructive" | "sage" | "neutral"
> = {
  DRAFT: "neutral",
  PLANNED: "neutral",
  AVAILABLE: "sage",
  IN_PROGRESS: "sage",
  COMPLETED: "sage",
  ARCHIVED: "outline",
};
