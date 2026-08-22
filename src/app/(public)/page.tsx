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
    <div>
      <section className="bg-mesh-hero relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32">
        <div className="relative mx-auto max-w-3xl text-center">
          <Badge
            variant="outline"
            className="mb-4 border-white/20 bg-white/5 text-white/80"
          >
            Formação em construção · conteúdo aberto e vivo
          </Badge>
          <h1 className="text-balance text-4xl font-extrabold tracking-tighter text-white sm:text-6xl">
            Apex
          </h1>
          <p className="mt-3 text-lg text-white/70">
            Da infraestrutura à inteligência artificial.
          </p>
          <p className="mt-6 text-balance text-white/60">
            Uma formação de ~24 meses (104 semanas), 5 dias por semana, 3h30 por dia — cerca de
            1.700 horas de estudo e prática — construída para formar um perfil raro: alguém capaz
            de projetar, desenvolver, implantar e operar uma solução de ponta a ponta, da
            infraestrutura até agentes de inteligência artificial.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="rounded-full bg-white px-6 text-black hover:bg-white/90"
              asChild
            >
              <Link href="/register">
                Começar agora <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-white/30 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href="/login">Já tenho conta</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {areas.map(({ icon: Icon, label }) => (
            <Card key={label} className="rounded-2xl shadow-soft">
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
          <Card className="rounded-2xl shadow-soft">
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
          <Card className="rounded-2xl shadow-soft">
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
          <Card className="rounded-2xl shadow-soft">
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

        <section className="mt-20 rounded-3xl bg-primary p-8 text-center text-primary-foreground shadow-soft sm:p-12">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Resultado esperado
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-balance text-primary-foreground/80">
            Ao final, olhar para uma oportunidade de trabalho ou projeto de consultoria e dizer com
            confiança: &ldquo;eu consigo projetar, desenvolver, implantar e operar essa
            solução.&rdquo;
          </p>
          <Button
            size="lg"
            className="mt-6 rounded-full bg-white px-6 text-black hover:bg-white/90"
            asChild
          >
            <Link href="/register">
              Criar minha conta <ArrowRight className="size-4" />
            </Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
