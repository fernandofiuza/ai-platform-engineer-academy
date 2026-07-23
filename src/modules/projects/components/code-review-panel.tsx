"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, ScanSearch } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Markdown } from "@/components/markdown";
import { requestCodeReviewAction } from "@/modules/projects/actions";

type CodeReview = {
  id: string;
  score: number | null;
  feedback: string;
  provider: string;
  createdAt: Date;
};

export function CodeReviewPanel({
  projectId,
  hasRepoUrl,
  reviews,
}: {
  projectId: string;
  hasRepoUrl: boolean;
  reviews: CodeReview[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function onRequestReview() {
    startTransition(async () => {
      const result = await requestCodeReviewAction(projectId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Revisão de IA gerada.");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ScanSearch className="size-4" /> Revisão de código por IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertDescription>
            Avaliação assistida por IA (persona Tech Lead), não uma nota oficial. Baseada nas
            informações da sua submissão (URL do repositório, decisões, retrospectiva), não em
            uma leitura linha a linha do código.
          </AlertDescription>
        </Alert>

        <Button onClick={onRequestReview} disabled={isPending || !hasRepoUrl}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <ScanSearch className="size-4" />}
          Solicitar revisão de IA
        </Button>
        {!hasRepoUrl ? (
          <p className="text-xs text-muted-foreground">
            Vincule uma URL de repositório na sua submissão acima para habilitar a revisão.
          </p>
        ) : null}

        {reviews.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Histórico de revisões ({reviews.length})
            </h3>
            {reviews.map((review) => (
              <div key={review.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {review.score !== null ? (
                      <Badge>Nota: {review.score.toFixed(1)}</Badge>
                    ) : (
                      <Badge variant="secondary">Sem nota extraída</Badge>
                    )}
                    <Badge variant="outline">{review.provider}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {review.createdAt.toLocaleString("pt-BR")}
                  </span>
                </div>
                <div className="mt-2 text-sm">
                  <Markdown content={review.feedback} />
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
