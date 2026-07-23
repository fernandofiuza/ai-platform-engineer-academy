import type { Metadata } from "next";
import { FolderKanban } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Projetos" };

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Projetos</h1>
      <p className="mt-1 text-sm text-muted-foreground">Projetos práticos conectados ao currículo.</p>
      <div className="mt-6">
        <ComingSoon
          title="Projetos"
          description="Projetos práticos conectados ao currículo."
          phase="Fase 4"
          icon={FolderKanban}
        />
      </div>
    </div>
  );
}
