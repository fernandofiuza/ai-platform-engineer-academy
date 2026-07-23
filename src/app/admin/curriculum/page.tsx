import type { Metadata } from "next";
import { LibraryBig } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Currículo" };

export default function AdminCurriculumPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Currículo</h1>
      <p className="mt-1 text-sm text-muted-foreground">CRUD de programas, fases, módulos, semanas e aulas.</p>
      <div className="mt-6">
        <ComingSoon
          title="Currículo"
          description="CRUD de programas, fases, módulos, semanas e aulas."
          phase="Fase 2"
          icon={LibraryBig}
        />
      </div>
    </div>
  );
}
