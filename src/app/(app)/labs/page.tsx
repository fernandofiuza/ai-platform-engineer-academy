import type { Metadata } from "next";
import { FlaskConical } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Laboratórios" };

export default function LabsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Laboratórios</h1>
      <p className="mt-1 text-sm text-muted-foreground">Laboratórios técnicos guiados.</p>
      <div className="mt-6">
        <ComingSoon
          title="Laboratórios"
          description="Laboratórios técnicos guiados."
          phase="Fase 4"
          icon={FlaskConical}
        />
      </div>
    </div>
  );
}
