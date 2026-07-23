"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, FlaskConical, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { approveLabContentAction, generateLabContentAction } from "@/modules/laboratories/actions";
import { STATUS_LABELS } from "@/modules/curriculum/status";
import type { ContentStatus } from "@/generated/prisma/enums";

type Laboratory = { id: string; title: string; status: ContentStatus; aiGeneratedAt: Date | null };

export function LessonLabPanel({
  lessonId,
  laboratories,
}: {
  lessonId: string;
  laboratories: Laboratory[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const lab = laboratories[0];

  function onGenerate(confirmOverwrite = false) {
    startTransition(async () => {
      const result = await generateLabContentAction(lessonId, confirmOverwrite);
      if (result?.error) {
        if (result.needsConfirmation && window.confirm(`${result.error}\n\nGerar mesmo assim?`)) {
          onGenerate(true);
          return;
        }
        toast.error(result.error);
        return;
      }
      toast.success("Laboratório gerado por IA — revise e aprove.");
      router.refresh();
    });
  }

  function onApprove() {
    if (!lab) return;
    startTransition(async () => {
      const result = await approveLabContentAction(lab.id);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Laboratório aprovado e publicado.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          <FlaskConical className="size-4" /> Laboratório desta aula
        </span>
        <Button type="button" size="sm" variant="outline" onClick={() => onGenerate(false)} disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {lab ? "Gerar novamente com IA" : "Gerar laboratório com IA"}
        </Button>
      </div>

      {lab ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            {lab.title}
            <Badge variant={lab.status === "DRAFT" ? "outline" : "secondary"}>{STATUS_LABELS[lab.status]}</Badge>
          </span>
          {lab.status === "DRAFT" ? (
            <Button type="button" size="sm" onClick={onApprove} disabled={isPending}>
              <Check className="size-4" /> Aprovar e publicar
            </Button>
          ) : (
            <Link href={`/labs/${lab.id}`} className="underline">
              Ver laboratório
            </Link>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Nenhum laboratório vinculado ainda.</p>
      )}
    </div>
  );
}
