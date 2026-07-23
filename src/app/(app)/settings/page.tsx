import type { Metadata } from "next";
import { Settings as SettingsIcon } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Configurações" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
      <p className="mt-1 text-sm text-muted-foreground">Preferências da conta.</p>
      <div className="mt-6">
        <ComingSoon
          title="Configurações"
          description="Preferências da conta."
          phase="Fase 3"
          icon={SettingsIcon}
        />
      </div>
    </div>
  );
}
