import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Avaliações" };

export default function AssessmentsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Avaliações</h1>
      <p className="mt-1 text-sm text-muted-foreground">Quizzes e checkpoints de cada módulo.</p>
      <div className="mt-6">
        <ComingSoon
          title="Avaliações"
          description="Quizzes e checkpoints de cada módulo."
          phase="Fase 3"
          icon={ClipboardCheck}
        />
      </div>
    </div>
  );
}
