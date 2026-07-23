import type { Metadata } from "next";
import { CalendarClock } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Planejador de estudos" };

export default function PlannerPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Planejador de estudos</h1>
      <p className="mt-1 text-sm text-muted-foreground">Planejamento semanal baseado na sua carga de estudo.</p>
      <div className="mt-6">
        <ComingSoon
          title="Planejador de estudos"
          description="Planejamento semanal baseado na sua carga de estudo."
          phase="Fase 3"
          icon={CalendarClock}
        />
      </div>
    </div>
  );
}
