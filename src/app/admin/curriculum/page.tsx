import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeekAdminList } from "@/modules/admin-curriculum/components/week-admin-list";
import { getAllWeeksForAdmin } from "@/modules/admin-curriculum/queries";
import { PhaseRequirementsForm } from "@/modules/certifications/components/phase-requirements-form";
import { getAllAssessmentsForAdmin, getPhasesForAdminCertification } from "@/modules/certifications/queries";
import { getAllProjectsForAdmin } from "@/modules/projects/queries";

export const metadata: Metadata = { title: "Currículo" };

export default async function AdminCurriculumPage() {
  const [weeks, phases, projects, assessments] = await Promise.all([
    getAllWeeksForAdmin(),
    getPhasesForAdminCertification(),
    getAllProjectsForAdmin(),
    getAllAssessmentsForAdmin(),
  ]);

  const projectOptions = projects.map((p) => ({ id: p.id, label: p.title }));
  const assessmentOptions = assessments.map((a) => ({
    id: a.id,
    label: a.lesson ? `${a.title} (${a.lesson.title})` : a.title,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Currículo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {weeks.length} semanas. Clique em uma semana para editar título, objetivo, status e
          gerenciar aulas, flashcards e quiz.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requisitos de certificação por semestre</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {phases.map((phase) => (
            <div key={phase.id} className="space-y-1.5">
              <p className="text-sm font-medium">
                {phase.label}: {phase.name}
              </p>
              <PhaseRequirementsForm
                phaseId={phase.id}
                projects={projectOptions}
                assessments={assessmentOptions}
                initialProjectId={phase.finalProjectId}
                initialAssessmentId={phase.finalAssessmentId}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <WeekAdminList weeks={weeks} />
    </div>
  );
}
