import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Calendário" };

export default function CalendarPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Calendário</h1>
      <p className="mt-1 text-sm text-muted-foreground">Visualização mensal do seu planejamento de estudos.</p>
      <div className="mt-6">
        <ComingSoon
          title="Calendário"
          description="Visualização mensal do seu planejamento de estudos."
          phase="Fase 3"
          icon={CalendarDays}
        />
      </div>
    </div>
  );
}
