import type { Metadata } from "next";
import { Timer } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Sessões de estudo" };

export default function SessionsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Sessões de estudo</h1>
      <p className="mt-1 text-sm text-muted-foreground">Cronômetro e histórico de sessões de estudo.</p>
      <div className="mt-6">
        <ComingSoon
          title="Sessões de estudo"
          description="Cronômetro e histórico de sessões de estudo."
          phase="Fase 3"
          icon={Timer}
        />
      </div>
    </div>
  );
}
