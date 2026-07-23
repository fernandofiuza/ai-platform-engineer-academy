import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FolderKanban } from "lucide-react";

import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getProjects } from "@/modules/projects/queries";

export const metadata: Metadata = { title: "Projetos" };

const STATUS_LABELS: Record<string, string> = { OPEN: "Em andamento", DONE: "Concluído", CANCELLED: "Cancelado" };

export default async function ProjectsPage() {
  const [session, projects] = await Promise.all([auth(), getProjects()]);

  const submissions = session?.user
    ? await db.projectSubmission.findMany({
        where: { userId: session.user.id, projectId: { in: projects.map((p) => p.id) } },
      })
    : [];
  const submissionByProject = new Map(submissions.map((s) => [s.projectId, s]));

  if (projects.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Nenhum projeto disponível ainda</CardTitle>
          <CardDescription>
            Projetos práticos chegam conforme o currículo for definido em <code className="rounded bg-muted px-1 py-0.5">Curso.md</code>.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Projetos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Projetos práticos — &ldquo;nunca estudar uma tecnologia sem aplicá-la em um projeto real&rdquo;.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((project) => {
          const submission = submissionByProject.get(project.id);
          return (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="h-full transition-colors hover:bg-accent/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <FolderKanban className="size-5" />
                    </span>
                    <div>
                      <CardTitle className="text-base">{project.title}</CardTitle>
                      {project.objective ? <CardDescription>{project.objective}</CardDescription> : null}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  {submission ? (
                    <Badge variant={submission.status === "DONE" ? "default" : "secondary"}>
                      {STATUS_LABELS[submission.status]}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Ainda não iniciado</span>
                  )}
                  <ArrowRight className="size-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
