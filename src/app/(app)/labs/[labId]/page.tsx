import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";

import { auth } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Markdown } from "@/components/markdown";
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

  const plainSections: { title: string; content: string | null }[] = [
    { title: "Ambiente", content: lab.environment },
    { title: "Comandos", content: lab.commands },
    { title: "Resultado esperado", content: lab.expectedResult },
    { title: "Validação", content: lab.validation },
    { title: "Troubleshooting", content: lab.troubleshooting },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{lab.title}</h1>
        {lab.objective ? <p className="mt-1 text-sm text-muted-foreground">{lab.objective}</p> : null}
      </div>

      {lab.lesson ? (
        <Link href={`/learn/${lab.lesson.id}`}>
          <Card className="transition-colors hover:bg-accent/50">
            <CardContent className="flex items-center justify-between gap-3 py-4">
              <span className="flex items-center gap-2 text-sm">
                <BookOpen className="size-4 text-muted-foreground" />
                Referente à Semana {lab.lesson.week.number}
                {lab.lesson.week.phase ? `, ${lab.lesson.week.phase.label}` : ""}: {lab.lesson.title}
              </span>
              <ArrowRight className="size-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      ) : null}

      {lab.status === "DRAFT" ? (
        <Alert>
          <Sparkles className="size-4" />
          <AlertDescription>
            Este laboratório foi gerado por IA e ainda está aguardando revisão da área
            administrativa — pode conter erros.
          </AlertDescription>
        </Alert>
      ) : null}

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

      {lab.instructions ? (
        <Card>
          <CardContent className="pt-6">
            <Markdown content={lab.instructions} />
          </CardContent>
        </Card>
      ) : null}

      {plainSections
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
