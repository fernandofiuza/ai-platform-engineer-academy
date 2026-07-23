"use client";

import * as React from "react";
import { AlertTriangle, ArrowDown, Boxes, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/markdown";
import { requestArchitectureSuggestionAction } from "@/modules/architecture-advisor/actions";
import type { ArchitectureSuggestion } from "@/modules/architecture-advisor/actions";

export function ArchitectureAdvisorPanel() {
  const [isPending, startTransition] = React.useTransition();
  const [problem, setProblem] = React.useState("");
  const [suggestion, setSuggestion] = React.useState<ArchitectureSuggestion | null>(null);

  function onGenerate() {
    setSuggestion(null);
    startTransition(async () => {
      const response = await requestArchitectureSuggestionAction({ problem });
      if (response.error) {
        toast.error(response.error);
        return;
      }
      setSuggestion(response.result);
    });
  }

  return (
    <div className="space-y-4">
      <Textarea
        value={problem}
        onChange={(e) => setProblem(e.target.value)}
        placeholder='Descreva o problema, ex.: "quero integrar Firebird com IA para responder perguntas sobre os dados"'
        rows={4}
      />
      <Button onClick={onGenerate} disabled={isPending || problem.trim().length < 10}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        Gerar arquitetura sugerida
      </Button>

      {suggestion ? (
        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="size-4" />
            <AlertDescription>
              Sugestão gerada por IA (persona Arquiteto, provider <strong>{suggestion.provider}</strong>) —
              trate como ponto de partida para avaliação humana, nunca como decisão já aplicada ao seu
              sistema.
            </AlertDescription>
          </Alert>

          {suggestion.components.length > 0 ? (
            <div className="space-y-2">
              <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Boxes className="size-4" /> Diagrama (esquemático)
              </h2>
              <div className="flex flex-col items-stretch gap-1">
                {suggestion.components.map((component, index) => (
                  <React.Fragment key={component.name}>
                    <Card>
                      <CardContent className="py-3">
                        <p className="text-sm font-semibold">{component.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{component.justification}</p>
                      </CardContent>
                    </Card>
                    {index < suggestion.components.length - 1 ? (
                      <ArrowDown className="mx-auto size-4 text-muted-foreground" />
                    ) : null}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="mb-2 text-xs text-muted-foreground">
                  Não foi possível estruturar a resposta em componentes — mostrando o texto completo:
                </p>
                <Markdown content={suggestion.raw} />
              </CardContent>
            </Card>
          )}

          {suggestion.components.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              <Badge variant="secondary" className="mr-2">
                {suggestion.components.length} componente(s)
              </Badge>
              Fluxo ilustrativo (não é um diagrama Mermaid renderizado — mesma decisão de manter o
              bundle leve já usada em outras páginas).
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
