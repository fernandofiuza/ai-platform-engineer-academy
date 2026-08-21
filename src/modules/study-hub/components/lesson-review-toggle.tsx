"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { toggleLessonReviewMarkAction } from "@/modules/study-hub/actions";

export function LessonReviewToggle({
  lessonId,
  initialMarked,
}: {
  lessonId: string;
  initialMarked: boolean;
}) {
  const router = useRouter();
  const [marked, setMarked] = React.useState(initialMarked);
  const [isPending, startTransition] = React.useTransition();

  function toggle() {
    setMarked((prev) => !prev);
    startTransition(async () => {
      const result = await toggleLessonReviewMarkAction(lessonId);
      if (result?.error) {
        toast.error(result.error);
        setMarked((prev) => !prev);
        return;
      }
      router.refresh();
    });
  }

  return (
    <button type="button" onClick={toggle} disabled={isPending} className="inline-flex">
      <Badge variant={marked ? "default" : "outline"} className="cursor-pointer gap-1">
        <RefreshCw className="size-3" />
        {marked ? "Marcada para revisão" : "Marcar para revisão"}
      </Badge>
    </button>
  );
}
