"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateLabContentAction } from "@/modules/laboratories/actions";

function parseWeekNumbers(value: string): number[] {
  return value
    .split(",")
    .map((v) => Number.parseInt(v.trim(), 10))
    .filter((n) => Number.isInteger(n) && n >= 0);
}

export function AdminLabGenerator() {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [title, setTitle] = React.useState("");
  const [scenario, setScenario] = React.useState("");
  const [weeks, setWeeks] = React.useState("");

  function onGenerate() {
    const weekNumbers = parseWeekNumbers(weeks);
    if (weekNumbers.length === 0) {
      toast.error("Informe ao menos um número de semana (ex: 20,21,22).");
      return;
    }
    if (!scenario.trim()) {
      toast.error("Descreva o cenário de produção que o laboratório vai simular.");
      return;
    }

    startTransition(async () => {
      const result = await generateLabContentAction({
        weekNumbers,
        title: title.trim() || undefined,
        scenario: scenario.trim(),
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Laboratório gerado por IA — revise e aprove na lista abaixo.");
      setTitle("");
      setScenario("");
      setWeeks("");
      router.refresh();
    });
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4" /> Gerar novo laboratório com IA
        </CardTitle>
        <CardDescription>
          Um laboratório 100% guiado, baseado em um cenário real de produção, vinculado às aulas
          das semanas informadas (o conteúdo dessas aulas vira o contexto do que o laboratório
          precisa exercitar).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label>Título (opcional — se vazio, a IA deriva do cenário)</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Deploy de API interna em Kubernetes" />
        </div>
        <div className="space-y-1.5">
          <Label>Cenário de produção</Label>
          <Textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            rows={2}
            placeholder="Ex: publicar uma API interna em um cluster Kubernetes, com deploy, service e ingress"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Semanas vinculadas (números separados por vírgula)</Label>
          <Input value={weeks} onChange={(e) => setWeeks(e.target.value)} placeholder="Ex: 54,55,56" />
        </div>
        <Button type="button" onClick={onGenerate} disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Gerar com IA
        </Button>
      </CardContent>
    </Card>
  );
}
