"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { runCurriculumImportAction } from "@/modules/curriculum/actions";

export function RunImportButton() {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await runCurriculumImportAction();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result.result?.message ?? "Importação concluída.");
      router.refresh();
    });
  }

  return (
    <Button onClick={onClick} disabled={isPending}>
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <RefreshCw className="size-4" />
      )}
      Reimportar Curso.md
    </Button>
  );
}
