"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { toggleExternalLessonCompletionAction } from "@/modules/study-hub/actions";

export function ExternalLessonCompleteToggle({
  lessonId,
  completed,
}: {
  lessonId: string;
  completed: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function toggle() {
    startTransition(async () => {
      const result = await toggleExternalLessonCompletionAction(lessonId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Button type="button" variant={completed ? "secondary" : "default"} onClick={toggle} disabled={isPending}>
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : completed ? (
        <CheckCircle2 className="size-4" />
      ) : (
        <Circle className="size-4" />
      )}
      {completed ? "Aula concluída" : "Marcar como concluída"}
    </Button>
  );
}
