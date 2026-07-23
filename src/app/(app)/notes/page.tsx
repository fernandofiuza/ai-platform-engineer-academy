import type { Metadata } from "next";
import { NotebookPen } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Anotações" };

export default function NotesPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Anotações</h1>
      <p className="mt-1 text-sm text-muted-foreground">Caderno de anotações do estudante.</p>
      <div className="mt-6">
        <ComingSoon
          title="Anotações"
          description="Caderno de anotações do estudante."
          phase="Fase 3"
          icon={NotebookPen}
        />
      </div>
    </div>
  );
}
