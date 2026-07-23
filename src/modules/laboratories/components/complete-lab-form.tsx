"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { completeLaboratoryAction } from "@/modules/laboratories/actions";

export function CompleteLabForm({
  laboratoryId,
  initialCompletion,
}: {
  laboratoryId: string;
  initialCompletion: { evidenceUrl: string | null; notes: string | null } | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [evidenceUrl, setEvidenceUrl] = React.useState(initialCompletion?.evidenceUrl ?? "");
  const [notes, setNotes] = React.useState(initialCompletion?.notes ?? "");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await completeLaboratoryAction({ laboratoryId, evidenceUrl, notes });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(initialCompletion ? "Atualizado." : "Laboratório concluído!");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="lab-evidence">Link de evidência (opcional)</Label>
        <Input
          id="lab-evidence"
          value={evidenceUrl}
          onChange={(e) => setEvidenceUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lab-notes">Observações</Label>
        <Textarea id="lab-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
        {initialCompletion ? "Atualizar" : "Marcar como concluído"}
      </Button>
    </form>
  );
}
