import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";

import { auth } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Markdown } from "@/components/markdown";
import { CompleteLabForm } from "@/modules/laboratories/components/complete-lab-form";
import { describeLinkedWeeks } from "@/modules/laboratories/format";
import { getCompletionForUser, getLaboratoryById } from "@/modules/laboratories/queries";
import { stripWeekDayPrefix } from "@/modules/planning/format";

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
  const subjectLabel = describeLinkedWeeks(lab.lessons);

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

      {lab.lessons.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BookOpen className="size-4 text-muted-foreground" />
              Matéria: {subjectLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {lab.lessons.map((ll) => (
              <Link
                key={ll.lesson.id}
                href={`/learn/${ll.lesson.id}`}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent/50"
              >
                <span>{stripWeekDayPrefix(ll.lesson.title)}</span>
                <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
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
