import type { Metadata } from "next";
import { Briefcase } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Portfólio" };

export default function PortfolioPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Portfólio</h1>
      <p className="mt-1 text-sm text-muted-foreground">Checklist de qualidade dos seus repositórios.</p>
      <div className="mt-6">
        <ComingSoon
          title="Portfólio"
          description="Checklist de qualidade dos seus repositórios."
          phase="Fase 4"
          icon={Briefcase}
        />
      </div>
    </div>
  );
}
