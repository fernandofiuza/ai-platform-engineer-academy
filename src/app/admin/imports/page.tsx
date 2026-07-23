import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2, FileText } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RunImportButton } from "@/modules/curriculum/components/run-import-button";
import { getLatestImportJob } from "@/modules/curriculum/queries";

export const metadata: Metadata = { title: "Importações" };

export default async function AdminImportsPage() {
  const job = await getLatestImportJob();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Importações</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Importa a estrutura do currículo a partir de <code className="rounded bg-muted px-1 py-0.5">Curso.md</code>.
            A reimportação é idempotente e não sobrescreve dados sem necessidade.
          </p>
        </div>
        <RunImportButton />
      </div>

      {!job ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Nenhuma importação executada ainda</CardTitle>
            <CardDescription>
              Clique em &quot;Reimportar Curso.md&quot; ou rode{" "}
              <code className="rounded bg-muted px-1 py-0.5">npm run curriculum:import</code>.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <FileText className="size-5" />
                </span>
                <div>
                  <CardTitle className="text-base">Última importação</CardTitle>
                  <CardDescription>
                    {job.sourceFile} · {job.startedAt.toLocaleString("pt-BR")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-semibold">{job.createdCount}</p>
                <p className="text-xs text-muted-foreground">criados</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">{job.updatedCount}</p>
                <p className="text-xs text-muted-foreground">atualizados</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">{job.skippedCount}</p>
                <p className="text-xs text-muted-foreground">sem alteração</p>
              </div>
            </CardContent>
          </Card>

          {job.warnings.length === 0 ? (
            <Alert>
              <CheckCircle2 className="size-4" />
              <AlertTitle>Nenhum aviso</AlertTitle>
              <AlertDescription>
                Todos os trechos esperados de <code className="rounded bg-muted px-1 py-0.5">Curso.md</code> foram
                reconhecidos.
              </AlertDescription>
            </Alert>
          ) : (
            <div>
              <h2 className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="size-4 text-amber-500" /> Avisos para revisão
                administrativa ({job.warnings.length})
              </h2>
              <div className="mt-2 space-y-2">
                {job.warnings.map((warning) => (
                  <Alert key={warning.id} variant="destructive">
                    <AlertTriangle className="size-4" />
                    <AlertTitle className="flex items-center gap-2">
                      {warning.targetEntityHint ? (
                        <Badge variant="outline">{warning.targetEntityHint}</Badge>
                      ) : null}
                      {warning.reason}
                    </AlertTitle>
                    <AlertDescription>Trecho: &ldquo;{warning.excerpt}&rdquo;</AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
