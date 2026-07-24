import type { Metadata } from "next";
import Link from "next/link";
import { Award, CheckCircle2, Circle } from "lucide-react";

import { auth } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CertificationRequestButton } from "@/modules/certifications/components/certification-request-button";
import { getPhasesWithCertificationOverview } from "@/modules/certifications/queries";

export const metadata: Metadata = { title: "Certificações" };

export default async function CertificationsPage() {
  const session = await auth();
  const overview = await getPhasesWithCertificationOverview(session!.user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Certificações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Certificado interno da formação por fase — não é uma certificação de mercado.
        </p>
      </div>

      <Alert>
        <Award className="size-4" />
        <AlertDescription>
          Cada fase exige: todas as semanas obrigatórias concluídas, o projeto final da
          fase submetido como concluído, e a avaliação final da fase respondida.
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        {overview.map(({ phase, certification, eligibility }) => (
          <Card key={phase.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">
                    {phase.label}: {phase.name}
                  </CardTitle>
                  {certification ? (
                    <CardDescription>
                      Emitido em {certification.issuedAt.toLocaleDateString("pt-BR")} — código{" "}
                      {certification.code}
                    </CardDescription>
                  ) : (
                    <CardDescription>Ainda não certificado.</CardDescription>
                  )}
                </div>
                {certification ? (
                  <Badge>Certificado</Badge>
                ) : eligibility?.eligible ? (
                  <CertificationRequestButton phaseId={phase.id} />
                ) : (
                  <Badge variant="secondary">Requisitos pendentes</Badge>
                )}
              </div>
            </CardHeader>
            {certification ? (
              <CardContent>
                <Link href={`/certifications/${certification.id}`} className="text-sm underline">
                  Ver certificado
                </Link>
              </CardContent>
            ) : eligibility ? (
              <CardContent className="space-y-1 text-sm">
                <RequirementRow
                  done={eligibility.weeksComplete}
                  label={`Semanas concluídas (${eligibility.completedLessons}/${eligibility.requiredLessons})`}
                />
                <RequirementRow
                  done={eligibility.hasFinalProject && eligibility.projectDone}
                  label={
                    eligibility.hasFinalProject
                      ? "Projeto final da fase submetido como concluído"
                      : "Projeto final da fase ainda não definido pela área administrativa"
                  }
                />
                <RequirementRow
                  done={eligibility.hasFinalAssessment && eligibility.assessmentDone}
                  label={
                    eligibility.hasFinalAssessment
                      ? "Avaliação final da fase respondida"
                      : "Avaliação final da fase ainda não definida pela área administrativa"
                  }
                />
              </CardContent>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}

function RequirementRow({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {done ? (
        <CheckCircle2 className="size-4 shrink-0 text-primary" />
      ) : (
        <Circle className="size-4 shrink-0 text-muted-foreground" />
      )}
      <span className={done ? "" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}
