"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteExternalCourseAction } from "@/modules/study-hub/actions";

export function ExternalCourseDeleteButton({
  courseId,
  courseTitle,
}: {
  courseId: string;
  courseTitle: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function remove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Excluir o curso "${courseTitle}" e todo o seu conteúdo? Essa ação não pode ser desfeita.`)) {
      return;
    }
    startTransition(async () => {
      const result = await deleteExternalCourseAction(courseId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Curso excluído.");
      router.push("/study-hub/courses");
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={`Excluir curso "${courseTitle}"`}
      onClick={remove}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Trash2 className="size-3.5 text-muted-foreground" />
      )}
    </Button>
  );
}
