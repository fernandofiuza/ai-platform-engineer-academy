import type { Metadata } from "next";
import { Layers } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Flashcards" };

export default function FlashcardsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Flashcards</h1>
      <p className="mt-1 text-sm text-muted-foreground">Revisão espaçada dos conceitos estudados.</p>
      <div className="mt-6">
        <ComingSoon
          title="Flashcards"
          description="Revisão espaçada dos conceitos estudados."
          phase="Fase 3"
          icon={Layers}
        />
      </div>
    </div>
  );
}
