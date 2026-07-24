import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FlaskConical } from "lucide-react";

import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getLaboratories } from "@/modules/laboratories/queries";
import { describeLinkedWeeks } from "@/modules/laboratories/format";

export const metadata: Metadata = { title: "Laboratórios" };

export default async function LabsPage() {
  const [session, labs] = await Promise.all([auth(), getLaboratories()]);

  const completions = session?.user
    ? await db.laboratoryCompletion.findMany({
        where: { userId: session.user.id, laboratoryId: { in: labs.map((l) => l.id) } },
      })
    : [];
  const completedIds = new Set(completions.map((c) => c.laboratoryId));

  if (labs.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Nenhum laboratório disponível ainda</CardTitle>
          <CardDescription>
            Laboratórios técnicos chegam conforme o currículo for definido.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Laboratórios</h1>
        <p className="mt-1 text-sm text-muted-foreground">Laboratórios técnicos guiados, passo a passo.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {labs.map((lab) => {
          const weeksLabel = describeLinkedWeeks(lab.lessons);
          return (
            <Link key={lab.id} href={`/labs/${lab.id}`}>
              <Card className="h-full transition-colors hover:bg-accent/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <FlaskConical className="size-5" />
                    </span>
                    <div>
                      <CardTitle className="text-base">{lab.title}</CardTitle>
                      {weeksLabel ? (
                        <CardDescription>Referente à {weeksLabel}</CardDescription>
                      ) : lab.scenario ? (
                        <CardDescription>{lab.scenario}</CardDescription>
                      ) : lab.objective ? (
                        <CardDescription>{lab.objective}</CardDescription>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  {completedIds.has(lab.id) ? (
                    <span className="flex items-center gap-1 text-xs text-primary">
                      <CheckCircle2 className="size-3.5" /> concluído
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Não iniciado</span>
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
