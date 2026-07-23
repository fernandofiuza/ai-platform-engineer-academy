import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeReviewPanel } from "@/modules/projects/components/code-review-panel";
import { SubmissionForm } from "@/modules/projects/components/submission-form";
import { getProjectById, getSubmissionForUser } from "@/modules/projects/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string }>;
}): Promise<Metadata> {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  return { title: project ? project.title : "Projeto" };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [session, project] = await Promise.all([auth(), getProjectById(projectId)]);

  if (!project) notFound();

  const submission = session?.user
    ? await getSubmissionForUser(session.user.id, projectId)
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{project.title}</h1>
        {project.objective ? <p className="mt-1 text-sm text-muted-foreground">{project.objective}</p> : null}
      </div>

      {project.problem ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Problema / contexto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{project.problem}</p>
            {project.context ? <p>{project.context}</p> : null}
          </CardContent>
        </Card>
      ) : null}

      {project.requirements.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Requisitos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {project.requirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            {project.optionalRequirements.length > 0 ? (
              <>
                <p className="mt-3 text-xs font-medium text-muted-foreground">Opcionais</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {project.optionalRequirements.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {project.acceptanceCriteria.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Critérios de aceite</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {project.acceptanceCriteria.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sua submissão</CardTitle>
        </CardHeader>
        <CardContent>
          <SubmissionForm projectId={project.id} initialSubmission={submission} />
        </CardContent>
      </Card>

      {session?.user ? (
        <CodeReviewPanel
          projectId={project.id}
          hasRepoUrl={Boolean(submission?.repoUrl)}
          reviews={submission?.codeReviews ?? []}
        />
      ) : null}
    </div>
  );
}
