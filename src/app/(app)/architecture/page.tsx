import type { Metadata } from "next";

import { ArchitectureAdvisorPanel } from "@/modules/architecture-advisor/components/architecture-advisor-panel";

export const metadata: Metadata = { title: "IA de Arquitetura" };

export default function ArchitectureAdvisorPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">IA de Arquitetura</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Descreva um problema em texto livre e receba uma arquitetura sugerida (persona
          Arquiteto), com a justificativa de cada componente.
        </p>
      </div>

      <ArchitectureAdvisorPanel />
    </div>
  );
}
