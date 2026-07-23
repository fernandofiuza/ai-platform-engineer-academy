import type { Metadata } from "next";
import { User } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Perfil" };

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>
      <p className="mt-1 text-sm text-muted-foreground">Dados pessoais e preferências de estudo.</p>
      <div className="mt-6">
        <ComingSoon
          title="Perfil"
          description="Dados pessoais e preferências de estudo."
          phase="Fase 3"
          icon={User}
        />
      </div>
    </div>
  );
}
