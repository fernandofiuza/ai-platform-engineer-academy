import type { Metadata } from "next";
import Link from "next/link";
import { FlaskConical, FolderKanban, LibraryBig, UploadCloud } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Administração" };

const ADMIN_AREAS = [
  {
    href: "/admin/curriculum",
    title: "Currículo",
    description: "Programas, fases, módulos, semanas e aulas.",
    icon: LibraryBig,
  },
  {
    href: "/admin/projects",
    title: "Projetos",
    description: "Projetos práticos da formação.",
    icon: FolderKanban,
  },
  {
    href: "/admin/labs",
    title: "Laboratórios",
    description: "Laboratórios técnicos guiados.",
    icon: FlaskConical,
  },
  {
    href: "/admin/imports",
    title: "Importações",
    description: "Importação e reimportação de Curso.md.",
    icon: UploadCloud,
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Administração</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Área restrita a administradores para manter o conteúdo da formação.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ADMIN_AREAS.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="h-full transition-colors hover:bg-accent/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
