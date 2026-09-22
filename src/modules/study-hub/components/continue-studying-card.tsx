import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type ContinueStudying = {
  type: "native" | "external";
  title: string;
  contextLabel: string;
  href: string;
  progressPercent: number;
} | null;

export function ContinueStudyingCard({ item }: { item: ContinueStudying }) {
  if (!item) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4" /> Continuar estudando
          </CardTitle>
          <CardDescription>
            Você ainda não começou nenhuma aula. Comece pelo{" "}
            <Link href="/roadmap" className="underline">
              roadmap
            </Link>{" "}
            ou{" "}
            <Link href="/study-hub/courses" className="underline">
              adicione um curso externo
            </Link>
            .
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="size-4" /> Continuar estudando
        </CardTitle>
        <CardDescription>{item.contextLabel}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm font-medium">{item.title}</p>
        <div className="flex items-center gap-3">
          <Progress value={item.progressPercent} className="h-2" />
          <span className="shrink-0 text-sm text-muted-foreground">{item.progressPercent}%</span>
        </div>
        <Button asChild variant="cta">
          <Link href={item.href}>
            Continuar <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
