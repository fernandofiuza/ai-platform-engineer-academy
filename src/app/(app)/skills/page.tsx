import type { Metadata } from "next";
import { Target } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Mapa de competências" };

export default function SkillsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Mapa de competências</h1>
      <p className="mt-1 text-sm text-muted-foreground">Evolução das suas competências técnicas.</p>
      <div className="mt-6">
        <ComingSoon
          title="Mapa de competências"
          description="Evolução das suas competências técnicas."
          phase="Fase 4"
          icon={Target}
        />
      </div>
    </div>
  );
}
