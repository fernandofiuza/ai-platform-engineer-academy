import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ComingSoon({
  title,
  description,
  phase,
  icon: Icon = Construction,
}: {
  title: string;
  description: string;
  phase: string;
  icon?: LucideIcon;
}) {
  return (
    <Card className="border-dashed">
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
      <CardContent>
        <Badge variant="secondary">Planejado para a {phase}</Badge>
        <p className="mt-3 text-sm text-muted-foreground">
          Esta área ainda não foi implementada. A navegação já está no lugar; a funcionalidade
          chega nas próximas entregas verticais do projeto (ver
          {" "}<code className="rounded bg-muted px-1 py-0.5 text-xs">docs/IMPLEMENTATION_PLAN.md</code>).
        </p>
      </CardContent>
    </Card>
  );
}
