import type { Metadata } from "next";

import { AdminProjectForm } from "@/modules/projects/components/admin-project-form";
import { getAllProjectsForAdmin } from "@/modules/projects/queries";

export const metadata: Metadata = { title: "Projetos" };

export default async function AdminProjectsPage() {
  const projects = await getAllProjectsForAdmin();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Projetos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerenciar os projetos práticos disponíveis para os estudantes.
        </p>
      </div>
      <div className="space-y-3">
        {projects.map((project) => (
          <AdminProjectForm key={project.id} project={project} />
        ))}
        <AdminProjectForm />
      </div>
    </div>
  );
}
