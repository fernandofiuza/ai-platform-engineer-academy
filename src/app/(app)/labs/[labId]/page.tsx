import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompleteLabForm } from "@/modules/laboratories/components/complete-lab-form";
import { getCompletionForUser, getLaboratoryById } from "@/modules/laboratories/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ labId: string }>;
}): Promise<Metadata> {
  const { labId } = await params;
  const lab = await getLaboratoryById(labId);
  return { title: lab ? lab.title : "Laboratório" };
}

export default async function LaboratoryDetailPage({
  params,
}: {
  params: Promise<{ labId: string }>;
}) {
  const { labId } = await params;
  const [session, lab] = await Promise.all([auth(), getLaboratoryById(labId)]);

  if (!lab) notFound();

  const completion = session?.user ? await getCompletionForUser(session.user.id, labId) : null;

  const sections: { title: string; content: string | null }[] = [
    { title: "Objetivo", content: lab.objective },
    { title: "Ambiente", content: lab.environment },
    { title: "Instruções", content: lab.instructions },
    { title: "Comandos", content: lab.commands },
    { title: "Resultado esperado", content: lab.expectedResult },
    { title: "Validação", content: lab.validation },
    { title: "Troubleshooting", content: lab.troubleshooting },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{lab.title}</h1>
      </div>

      {lab.prerequisites.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pré-requisitos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {lab.prerequisites.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {sections
        .filter((s) => s.content)
        .map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="text-base">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">
                {section.content}
              </pre>
            </CardContent>
          </Card>
        ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{completion ? "Concluído" : "Marcar como concluído"}</CardTitle>
        </CardHeader>
        <CardContent>
          <CompleteLabForm
            laboratoryId={lab.id}
            initialCompletion={
              completion ? { evidenceUrl: completion.evidenceUrl, notes: completion.notes } : null
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
