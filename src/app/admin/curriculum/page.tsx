import type { Metadata } from "next";

import { WeekAdminList } from "@/modules/admin-curriculum/components/week-admin-list";
import { getAllWeeksForAdmin } from "@/modules/admin-curriculum/queries";

export const metadata: Metadata = { title: "Currículo" };

export default async function AdminCurriculumPage() {
  const weeks = await getAllWeeksForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Currículo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {weeks.length} semanas. Clique em uma semana para editar título, objetivo, status e
          gerenciar aulas, flashcards e quiz.
        </p>
      </div>
      <WeekAdminList weeks={weeks} />
    </div>
  );
}
