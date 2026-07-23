"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleMilestoneAchievedAction } from "@/modules/ai-labs/actions";

type Milestone = { id: string; order: number; title: string; status: string };

export function MilestoneTimeline({
  milestones,
  isAdmin,
}: {
  milestones: Milestone[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function onToggle(id: string) {
    startTransition(async () => {
      const result = await toggleMilestoneAchievedAction(id);
      if (result?.error) toast.error(result.error);
      router.refresh();
    });
  }

  return (
    <ol className="space-y-1">
      {milestones.map((milestone) => {
        const achieved = milestone.status === "COMPLETED";
        return (
          <li
            key={milestone.id}
            className={cn(
              "flex items-center gap-3 rounded-md border px-3 py-2",
              achieved ? "border-primary/40 bg-primary/5" : "border-border"
            )}
          >
            {achieved ? (
              <CheckCircle2 className="size-4 shrink-0 text-primary" />
            ) : (
              <Circle className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className={cn("flex-1 text-sm", !achieved && "text-muted-foreground")}>
              {milestone.title}
            </span>
            {isAdmin ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => onToggle(milestone.id)}
              >
                {isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                {achieved ? "Desmarcar" : "Marcar alcançado"}
              </Button>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
