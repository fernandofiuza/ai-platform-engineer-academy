import type { Metadata } from "next";
import { Sparkles } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Tutor de IA" };

export default function AiTutorPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Tutor de IA</h1>
      <p className="mt-1 text-sm text-muted-foreground">Tutor de IA nível 1 para apoiar seus estudos.</p>
      <div className="mt-6">
        <ComingSoon
          title="Tutor de IA"
          description="Tutor de IA nível 1 para apoiar seus estudos."
          phase="Fase 5"
          icon={Sparkles}
        />
      </div>
    </div>
  );
}
