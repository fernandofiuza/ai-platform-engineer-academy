import type { Metadata } from "next";
import Link from "next/link";
import { RefreshCw } from "lucide-react";

import { auth } from "@/lib/auth";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getReviewItems } from "@/modules/study-hub/queries";

export const metadata: Metadata = { title: "Revisões · Study Hub" };

export default async function StudyHubReviewPage() {
  const session = await auth();
  const userId = session!.user.id;

  const items = await getReviewItems(userId);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Revisões</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aulas que você marcou para revisar depois — nativas e de cursos externos.
        </p>
      </div>

      {items.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Nada marcado para revisão</CardTitle>
            <CardDescription>
              Marque uma aula clicando em &ldquo;Marcar para revisão&rdquo; na própria aula.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="divide-y rounded-lg border">
          {items.map((item) => (
            <Link
              key={`${item.type}-${item.id}`}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
            >
              <RefreshCw className="size-4 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.contextLabel}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
