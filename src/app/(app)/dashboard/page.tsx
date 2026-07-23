import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarCheck, ListChecks, Sparkles, Timer } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard" };

const NEXT_STEPS = [
  {
    title: "Semana 0 — Preparação do Ambiente",
    description: "Checklist interativo de ferramentas e ambiente de estudo.",
    phase: "Fase 2",
  },
  {
    title: "Roadmap das 104 semanas",
    description: "Estrutura completa da formação, com o que já está definido em Curso.md.",
    phase: "Fase 2",
  },
  {
    title: "Primeira sessão de estudo",
    description: "Cronômetro de sessão e registro de progresso.",
    phase: "Fase 3",
  },
];

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user;

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { name: true, createdAt: true },
  });

  const firstName = (dbUser?.name ?? user.name ?? "").split(" ")[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Olá, {firstName} 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bem-vindo(a) à AI Platform Engineer Academy. Sua conta foi criada em{" "}
          {dbUser?.createdAt.toLocaleDateString("pt-BR")}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ListChecks className="size-4" /> Progresso geral
            </CardDescription>
            <CardTitle className="text-3xl">—</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Disponível a partir da Fase 2, quando o currículo for importado de Curso.md.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Timer className="size-4" /> Horas estudadas
            </CardDescription>
            <CardTitle className="text-3xl">—</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            As sessões de estudo chegam na Fase 3.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CalendarCheck className="size-4" /> Sequência de estudo
            </CardDescription>
            <CardTitle className="text-3xl">—</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            A gamificação chega na Fase 4.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" /> Este ainda é o início
          </CardTitle>
          <CardDescription>
            Você concluiu a Fase 1 (fundação): conta, autenticação, layout e design system estão
            no ar. As próximas entregas verticais trazem o currículo real e o acompanhamento de
            estudo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {NEXT_STEPS.map((step) => (
              <li key={step.title} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {step.phase}
                </Badge>
              </li>
            ))}
          </ul>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/roadmap">
              Ver roadmap <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
