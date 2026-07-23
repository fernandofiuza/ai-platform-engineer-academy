import type { Metadata } from "next";
import {
  Boxes,
  Building2,
  Cloud,
  Cpu,
  Database,
  GitBranch,
  LayoutTemplate,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MilestoneTimeline } from "@/modules/ai-labs/components/milestone-timeline";
import { getArchitectureMilestones, getDepartments } from "@/modules/ai-labs/queries";

export const metadata: Metadata = { title: "AI Labs" };

const DEPARTMENT_ICONS: Record<string, typeof Building2> = {
  Infraestrutura: Terminal,
  Backend: Database,
  "Front-end": LayoutTemplate,
  IA: Cpu,
  DevOps: GitBranch,
  Cloud: Cloud,
  Segurança: ShieldCheck,
  Dados: Boxes,
  Produto: Sparkles,
  Arquitetura: Building2,
};

export default async function AiLabsPage() {
  const [session, departments, milestones] = await Promise.all([
    auth(),
    getDepartments(),
    getArchitectureMilestones(),
  ]);

  const isAdmin = session?.user?.role === "ADMIN";
  const achievedCount = milestones.filter((m) => m.status === "COMPLETED").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Labs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A empresa fictícia construída ao longo da formação — cada módulo contribui para um
          departamento e para a evolução da arquitetura da plataforma.
        </p>
      </div>

      {departments.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>AI Labs ainda não importada</CardTitle>
            <CardDescription>
              Rode <code className="rounded bg-muted px-1 py-0.5">npm run curriculum:import -- --force</code> para
              extrair os departamentos e a linha do tempo de <code className="rounded bg-muted px-1 py-0.5">Curso.md</code>.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div>
            <h2 className="text-sm font-medium text-muted-foreground">Departamentos</h2>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {departments.map((dept) => {
                const Icon = DEPARTMENT_ICONS[dept.name] ?? Building2;
                return (
                  <Card key={dept.id}>
                    <CardContent className="flex flex-col items-center gap-2 pt-6 text-center">
                      <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                        <Icon className="size-5" />
                      </span>
                      <span className="text-sm font-medium">{dept.name}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium text-muted-foreground">
              Linha do tempo de arquitetura — {achievedCount}/{milestones.length} alcançados
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Extraída de <code className="rounded bg-muted px-1 py-0.5">Curso.md</code>. Fica marcada
              como planejada até a administração confirmar que foi de fato alcançada — a
              importação nunca marca nada como concluído automaticamente.
            </p>
            <div className="mt-2">
              <MilestoneTimeline milestones={milestones} isAdmin={isAdmin} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
