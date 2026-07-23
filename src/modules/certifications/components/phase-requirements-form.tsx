"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setPhaseCertificationRequirementsAction } from "@/modules/certifications/actions";

const NONE = "__none__";

type Option = { id: string; label: string };

export function PhaseRequirementsForm({
  phaseId,
  projects,
  assessments,
  initialProjectId,
  initialAssessmentId,
}: {
  phaseId: string;
  projects: Option[];
  assessments: Option[];
  initialProjectId: string | null;
  initialAssessmentId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [projectId, setProjectId] = React.useState(initialProjectId ?? NONE);
  const [assessmentId, setAssessmentId] = React.useState(initialAssessmentId ?? NONE);

  function onSave() {
    startTransition(async () => {
      const result = await setPhaseCertificationRequirementsAction({
        phaseId,
        finalProjectId: projectId === NONE ? null : projectId,
        finalAssessmentId: assessmentId === NONE ? null : assessmentId,
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Requisitos de certificação salvos.");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Select value={projectId} onValueChange={setProjectId}>
        <SelectTrigger>
          <SelectValue placeholder="Projeto final" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Nenhum projeto final definido</SelectItem>
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={assessmentId} onValueChange={setAssessmentId}>
        <SelectTrigger>
          <SelectValue placeholder="Avaliação final" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Nenhuma avaliação final definida</SelectItem>
          {assessments.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button size="sm" onClick={onSave} disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Salvar
      </Button>
    </div>
  );
}
