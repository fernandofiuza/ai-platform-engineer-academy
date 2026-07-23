import type { Metadata } from "next";

import { AdminLabForm } from "@/modules/laboratories/components/admin-lab-form";
import { getAllLaboratoriesForAdmin } from "@/modules/laboratories/queries";

export const metadata: Metadata = { title: "Laboratórios" };

export default async function AdminLabsPage() {
  const laboratories = await getAllLaboratoriesForAdmin();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Laboratórios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerenciar os laboratórios técnicos disponíveis para os estudantes.
        </p>
      </div>
      <div className="space-y-3">
        {laboratories.map((lab) => (
          <AdminLabForm key={lab.id} laboratory={lab} />
        ))}
        <AdminLabForm />
      </div>
    </div>
  );
}
