import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getSkillsWithProgress } from "@/modules/skills/queries";
import { SKILL_LEVEL_LABELS, SKILL_LEVEL_PROGRESS } from "@/modules/skills/labels";

export const metadata: Metadata = { title: "Mapa de competências" };

export default async function SkillsPage() {
  const session = await auth();
  const skills = await getSkillsWithProgress(session!.user.id);

  if (skills.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Nenhuma competência cadastrada ainda</CardTitle>
          <CardDescription>
            As competências chegam junto com o conteúdo do currículo.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const byCategory = new Map<string, typeof skills>();
  for (const skill of skills) {
    const list = byCategory.get(skill.category) ?? [];
    list.push(skill);
    byCategory.set(skill.category, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mapa de competências</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          O nível reflete evidências reais (aulas concluídas) — não é uma certificação oficial.
        </p>
      </div>

      {[...byCategory.entries()].map(([category, categorySkills]) => (
        <div key={category}>
          <h2 className="text-sm font-medium text-muted-foreground">{category}</h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {categorySkills.map((skill) => (
              <Card key={skill.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{skill.name}</CardTitle>
                    <Badge variant="secondary">{SKILL_LEVEL_LABELS[skill.level]}</Badge>
                  </div>
                  {skill.description ? (
                    <CardDescription>{skill.description}</CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent>
                  <Progress value={SKILL_LEVEL_PROGRESS[skill.level]} className="h-2" />
                  {skill.evidenceLessons.length > 0 ? (
                    <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                      {skill.evidenceLessons.map((lesson) => (
                        <li key={lesson.id}>
                          <Link href={`/learn/${lesson.id}`} className="underline">
                            {lesson.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">Sem evidências ainda.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
