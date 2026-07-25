"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, ExternalLink, Loader2, RefreshCw, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { checklistCompletion, QUALITY_CHECKLIST_ITEMS, type QualityChecklist } from "@/modules/portfolio/checklist";
import {
  deletePortfolioItemAction,
  syncPortfolioItemGitHubAction,
  updateChecklistAction,
} from "@/modules/portfolio/actions";

type Item = {
  id: string;
  repoUrl: string;
  qualityChecklist: unknown;
  project: { title: string } | null;
  githubSyncedAt: Date | null;
  githubDescription: string | null;
  githubOpenIssues: number | null;
  githubLatestRelease: string | null;
};

export function PortfolioItemCard({ item }: { item: Item }) {
  const router = useRouter();
  const [checklist, setChecklist] = React.useState(
    (item.qualityChecklist as QualityChecklist) ?? {}
  );
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [, startTransition] = React.useTransition();

  const { done, total, percent } = checklistCompletion(checklist);

  function toggleItem(key: string) {
    const next = { ...checklist, [key]: !checklist[key] };
    setChecklist(next);
    startTransition(async () => {
      const result = await updateChecklistAction({ itemId: item.id, checklist: next });
      if (result?.error) toast.error(result.error);
    });
  }

  function onDelete() {
    startTransition(async () => {
      const result = await deletePortfolioItemAction(item.id);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  async function onSync() {
    setIsSyncing(true);
    const result = await syncPortfolioItemGitHubAction(item.id);
    setIsSyncing(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Repositório sincronizado com o GitHub.");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div className="min-w-0">
          <CardTitle className="truncate text-base">
            <a
              href={item.repoUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-1.5 hover:underline"
            >
              {item.repoUrl.replace(/^https?:\/\//, "")} <ExternalLink className="size-3.5 shrink-0" />
            </a>
          </CardTitle>
          {item.project ? <Badge variant="secondary">{item.project.title}</Badge> : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Sincronizar com o GitHub" onClick={onSync} disabled={isSyncing}>
            {isSyncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Remover" onClick={onDelete}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {item.githubSyncedAt ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {item.githubDescription ? (
              <span className="italic">&ldquo;{item.githubDescription}&rdquo;</span>
            ) : null}
            <span className="flex items-center gap-1">
              <CircleAlert className="size-3.5" /> {item.githubOpenIssues ?? 0} issue(s) aberta(s)
            </span>
            {item.githubLatestRelease ? (
              <span className="flex items-center gap-1">
                <Tag className="size-3.5" /> {item.githubLatestRelease}
              </span>
            ) : null}
            <span>Sincronizado em {item.githubSyncedAt.toLocaleDateString("pt-BR")}</span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Ainda não sincronizado — clique no ícone de atualizar para preencher README, licença,
            CI e release automaticamente a partir do GitHub.
          </p>
        )}
        <div className="flex items-center gap-3">
          <Progress value={percent} className="h-2" />
          <span className="shrink-0 text-xs text-muted-foreground">
            {done}/{total}
          </span>
        </div>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {QUALITY_CHECKLIST_ITEMS.map((qi) => (
            <label key={qi.key} className="flex items-center gap-2 text-sm">
              <Checkbox checked={Boolean(checklist[qi.key])} onCheckedChange={() => toggleItem(qi.key)} />
              {qi.label}
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
