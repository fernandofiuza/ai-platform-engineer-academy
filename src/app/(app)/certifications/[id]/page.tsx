import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Award } from "lucide-react";

import { auth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { getCertificationById } from "@/modules/certifications/queries";

export const metadata: Metadata = { title: "Certificado" };

export default async function CertificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, certification] = await Promise.all([auth(), getCertificationById(id)]);

  if (!certification || certification.userId !== session?.user.id) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="border-2 border-primary/30">
        <CardContent className="space-y-4 py-10 text-center">
          <Award className="mx-auto size-12 text-primary" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Certificado interno da formação
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {certification.phase.program.name}
          </h1>
          <p className="text-lg">
            {certification.phase.label}: {certification.phase.name}
          </p>
          <p className="text-sm text-muted-foreground">
            Concedido a <strong>{certification.user.name}</strong> em{" "}
            {certification.issuedAt.toLocaleDateString("pt-BR")}
          </p>
          <p className="font-mono text-xs text-muted-foreground">Código: {certification.code}</p>
          <p className="mx-auto max-w-md text-xs text-muted-foreground">
            Este é um certificado interno da AI Platform Engineer Academy, emitido ao concluir as
            semanas obrigatórias, o projeto final e a avaliação final deste semestre — não é uma
            certificação de mercado nem substitui certificações oficiais de tecnologia.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
