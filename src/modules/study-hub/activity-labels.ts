import {
  CheckCircle2,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Timer,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import type { ActivityType } from "@/generated/prisma/enums";

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  LESSON_COMPLETED: "Concluiu",
  LESSON_REOPENED: "Reabriu",
  SESSION_FINISHED: "Estudou",
  LESSON_MARKED_REVIEW: "Marcou para revisão",
  LESSON_UNMARKED_REVIEW: "Desmarcou revisão",
  COURSE_STARTED: "Iniciou o curso",
  COURSE_COMPLETED: "Concluiu o curso",
};

export const ACTIVITY_ICONS: Record<ActivityType, LucideIcon> = {
  LESSON_COMPLETED: CheckCircle2,
  LESSON_REOPENED: RotateCcw,
  SESSION_FINISHED: Timer,
  LESSON_MARKED_REVIEW: RefreshCw,
  LESSON_UNMARKED_REVIEW: RefreshCw,
  COURSE_STARTED: PlayCircle,
  COURSE_COMPLETED: Trophy,
};

export function formatActivityLine(type: ActivityType, title: string, metadata: unknown) {
  if (type === "SESSION_FINISHED") {
    const minutes =
      metadata && typeof metadata === "object" && "durationMinutes" in metadata
        ? Number((metadata as { durationMinutes: unknown }).durationMinutes)
        : null;
    return minutes ? `${ACTIVITY_LABELS[type]} ${title} por ${minutes} min` : `${ACTIVITY_LABELS[type]} ${title}`;
  }
  return `${ACTIVITY_LABELS[type]} ${title}`;
}
