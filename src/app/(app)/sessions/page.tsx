import type { Metadata } from "next";
import { Clock, MessageSquare } from "lucide-react";

import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SessionTimer } from "@/modules/study-sessions/components/session-timer";
import { getActiveSession, getSessionHistory } from "@/modules/study-sessions/queries";

export const metadata: Metadata = { title: "Sessões de estudo" };

export default async function SessionsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [active, history] = await Promise.all([
    getActiveSession(userId),
    getSessionHistory(userId),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sessões de estudo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cronômetro persistente — sobrevive a atualização de página — e histórico de sessões.
        </p>
      </div>

      <SessionTimer initialSession={active} />

      <div>
        <h2 className="text-sm font-medium text-muted-foreground">Histórico</h2>
        {history.length === 0 ? (
          <Card className="mt-2 border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Nenhuma sessão registrada ainda</CardTitle>
              <CardDescription>Inicie uma sessão acima para começar seu histórico.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="mt-2 divide-y rounded-lg border">
            {history.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">
                    {s.startedAt.toLocaleDateString("pt-BR")} às{" "}
                    {s.startedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.lesson ? s.lesson.title : "Estudo livre"}
                    {s.notes ? (
                      <span className="ml-2 inline-flex items-center gap-1">
                        <MessageSquare className="size-3" /> {s.notes}
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {s.completedContent ? <Badge variant="secondary">concluiu conteúdo</Badge> : null}
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="size-3" /> {s.durationMinutes} min
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
