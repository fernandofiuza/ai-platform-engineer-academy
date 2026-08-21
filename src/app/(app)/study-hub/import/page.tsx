import type { Metadata } from "next";

import { ImportPreviewForm } from "@/modules/study-hub/components/import-preview-form";

export const metadata: Metadata = { title: "Importar curso · Study Hub" };

export default function StudyHubImportPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Importar curso</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cole a estrutura de um curso externo — módulos e aulas viram um checklist pronto.
        </p>
      </div>
      <ImportPreviewForm />
    </div>
  );
}
