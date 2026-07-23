"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveSubmissionAction } from "@/modules/projects/actions";

type Submission = {
  repoUrl: string | null;
  deployUrl: string | null;
  decisions: string | null;
  retrospective: string | null;
  status: "OPEN" | "DONE" | "CANCELLED";
} | null;

export function SubmissionForm({
  projectId,
  initialSubmission,
}: {
  projectId: string;
  initialSubmission: Submission;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [repoUrl, setRepoUrl] = React.useState(initialSubmission?.repoUrl ?? "");
  const [deployUrl, setDeployUrl] = React.useState(initialSubmission?.deployUrl ?? "");
  const [decisions, setDecisions] = React.useState(initialSubmission?.decisions ?? "");
  const [retrospective, setRetrospective] = React.useState(initialSubmission?.retrospective ?? "");
  const [status, setStatus] = React.useState(initialSubmission?.status ?? "OPEN");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveSubmissionAction({
        projectId,
        repoUrl,
        deployUrl,
        decisions,
        retrospective,
        status,
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Progresso salvo.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="repoUrl">URL do repositório</Label>
          <Input
            id="repoUrl"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/..."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deployUrl">URL de deploy (opcional)</Label>
          <Input
            id="deployUrl"
            value={deployUrl}
            onChange={(e) => setDeployUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="decisions">Decisões técnicas</Label>
        <Textarea id="decisions" value={decisions} onChange={(e) => setDecisions(e.target.value)} rows={3} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="retrospective">Retrospectiva</Label>
        <Textarea
          id="retrospective"
          value={retrospective}
          onChange={(e) => setRetrospective(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OPEN">Em andamento</SelectItem>
            <SelectItem value="DONE">Concluído</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Salvar
      </Button>
    </form>
  );
}
