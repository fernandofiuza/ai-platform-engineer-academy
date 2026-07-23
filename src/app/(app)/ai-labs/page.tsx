import type { Metadata } from "next";
import { Building2 } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "AI Labs" };

export default function AiLabsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">AI Labs</h1>
      <p className="mt-1 text-sm text-muted-foreground">Empresa fictícia e linha do tempo de arquitetura.</p>
      <div className="mt-6">
        <ComingSoon
          title="AI Labs"
          description="Empresa fictícia e linha do tempo de arquitetura."
          phase="Fase 4"
          icon={Building2}
        />
      </div>
    </div>
  );
}
