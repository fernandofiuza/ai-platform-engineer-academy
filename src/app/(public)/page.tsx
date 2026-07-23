import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Building2,
  CalendarClock,
  Cloud,
  Cpu,
  Database,
  GitBranch,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const areas = [
  { icon: Terminal, label: "Engenharia de Software" },
  { icon: Database, label: "Banco de Dados" },
  { icon: Cloud, label: "Infraestrutura e Cloud" },
  { icon: GitBranch, label: "DevOps e CI/CD" },
  { icon: Cpu, label: "Inteligência Artificial" },
  { icon: Boxes, label: "Automação e Agentes" },
  { icon: ShieldCheck, label: "Segurança e Observabilidade" },
  { icon: Building2, label: "Arquitetura Corporativa" },
];

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <section className="mx-auto max-w-3xl text-center">
        <Badge variant="secondary" className="mb-4">
          Formação em construção · conteúdo aberto e vivo
        </Badge>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          AI Platform Engineer Academy
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Da infraestrutura à inteligência artificial.
        </p>
        <p className="mt-6 text-balance text-muted-foreground">
          Uma formação de ~24 meses (104 semanas), 5 dias por semana, 3h30 por dia — cerca de
          1.700 horas de estudo e prática — construída para formar um perfil raro: alguém capaz
          de projetar, desenvolver, implantar e operar uma solução de ponta a ponta, da
          infraestrutura até agentes de inteligência artificial.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/register">
              Começar agora <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Já tenho conta</Link>
          </Button>
        </div>
      </section>

      <section className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {areas.map(({ icon: Icon, label }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 pt-6">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-4.5" />
              </span>
              <span className="text-sm font-medium">{label}</span>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-20 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CalendarClock className="size-5 text-primary" />
            <CardTitle className="mt-2">Para quem é</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Para quem quer sair do conhecimento fragmentado (só Python, só Docker, só n8n) e
            construir uma base sólida que conecta engenharia de software, infraestrutura, cloud,
            dados e inteligência artificial em um único perfil profissional coerente.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Sparkles className="size-5 text-primary" />
            <CardTitle className="mt-2">Metodologia</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="italic">
              &ldquo;Nunca estudar uma tecnologia sem aplicá-la em um projeto real.&rdquo;
            </p>
            <p className="mt-2">
              Em vez de dezenas de projetos soltos, tudo se conecta a uma única plataforma que
              evolui a cada módulo — a mesma que você está vendo agora.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Building2 className="size-5 text-primary" />
            <CardTitle className="mt-2">AI Labs</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Cada módulo também alimenta a evolução de uma empresa fictícia, a{" "}
            <strong className="text-foreground">AI Labs</strong>, com departamentos de
            Infraestrutura, Backend, Frontend, IA, DevOps, Cloud, Segurança, Dados, Produto e
            Arquitetura — e uma linha do tempo de arquitetura que cresce junto com você.
          </CardContent>
        </Card>
      </section>

      <section className="mt-20 rounded-2xl border bg-card p-8 text-center sm:p-12">
        <h2 className="text-2xl font-semibold tracking-tight">Resultado esperado</h2>
        <p className="mx-auto mt-3 max-w-2xl text-balance text-muted-foreground">
          Ao final, olhar para uma oportunidade de trabalho ou projeto de consultoria e dizer com
          confiança: &ldquo;eu consigo projetar, desenvolver, implantar e operar essa
          solução.&rdquo;
        </p>
        <Button size="lg" className="mt-6" asChild>
          <Link href="/register">
            Criar minha conta <ArrowRight className="size-4" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
