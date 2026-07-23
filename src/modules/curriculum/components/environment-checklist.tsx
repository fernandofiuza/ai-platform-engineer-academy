"use client";

import * as React from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { updateChecklistItemAction } from "@/modules/curriculum/actions";

type ChecklistItem = {
  id: string;
  category: string;
  label: string;
};

type ProgressState = {
  done: boolean;
  note: string;
  evidenceUrl: string;
  installedVersion: string;
  reviewNeeded: boolean;
};

function emptyState(): ProgressState {
  return { done: false, note: "", evidenceUrl: "", installedVersion: "", reviewNeeded: false };
}

export function EnvironmentChecklist({
  items,
  initialProgress,
}: {
  items: ChecklistItem[];
  initialProgress: Record<string, ProgressState>;
}) {
  const [state, setState] = React.useState<Record<string, ProgressState>>(() => {
    const merged: Record<string, ProgressState> = {};
    for (const item of items) {
      merged[item.id] = initialProgress[item.id] ?? emptyState();
    }
    return merged;
  });
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<string | null>(null);

  const total = items.length;
  const done = Object.values(state).filter((s) => s.done).length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  const categories = Array.from(new Set(items.map((item) => item.category)));

  async function persist(itemId: string, next: ProgressState) {
    setPending(itemId);
    const result = await updateChecklistItemAction({
      checklistItemId: itemId,
      done: next.done,
      note: next.note || undefined,
      evidenceUrl: next.evidenceUrl || undefined,
      installedVersion: next.installedVersion || undefined,
      reviewNeeded: next.reviewNeeded,
    });
    setPending(null);
    if (result?.error) {
      toast.error(result.error);
    }
  }

  function toggleDone(itemId: string) {
    const next = { ...state[itemId], done: !state[itemId].done };
    setState((prev) => ({ ...prev, [itemId]: next }));
    void persist(itemId, next);
  }

  function updateField(itemId: string, field: keyof ProgressState, value: string | boolean) {
    setState((prev) => ({ ...prev, [itemId]: { ...prev[itemId], [field]: value } }));
  }

  function saveDetails(itemId: string) {
    void persist(itemId, state[itemId]);
    toast.success("Detalhes salvos.");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Progress value={percent} className="h-2" />
        <span className="shrink-0 text-sm text-muted-foreground">
          {done}/{total} ({percent}%)
        </span>
      </div>

      {categories.map((category) => (
        <div key={category}>
          <h3 className="text-sm font-medium text-muted-foreground">{category}</h3>
          <div className="mt-2 divide-y rounded-lg border">
            {items
              .filter((item) => item.category === category)
              .map((item) => {
                const itemState = state[item.id];
                const isExpanded = expanded === item.id;
                return (
                  <div key={item.id} className="px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={itemState.done}
                        onCheckedChange={() => toggleDone(item.id)}
                        aria-label={`Marcar "${item.label}" como concluído`}
                      />
                      <span
                        className={cn(
                          "flex-1 text-sm",
                          itemState.done && "text-muted-foreground line-through"
                        )}
                      >
                        {item.label}
                      </span>
                      {itemState.reviewNeeded ? (
                        <Badge variant="outline">revisar</Badge>
                      ) : null}
                      {pending === item.id ? (
                        <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Mais detalhes"
                        onClick={() => setExpanded(isExpanded ? null : item.id)}
                      >
                        <ChevronDown
                          className={cn("size-4 transition-transform", isExpanded && "rotate-180")}
                        />
                      </Button>
                    </div>

                    {isExpanded ? (
                      <div className="mt-3 grid gap-3 pl-7 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor={`note-${item.id}`} className="text-xs">
                            Observações
                          </Label>
                          <Input
                            id={`note-${item.id}`}
                            value={itemState.note}
                            onChange={(e) => updateField(item.id, "note", e.target.value)}
                            placeholder="Ex.: instalado via winget"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`version-${item.id}`} className="text-xs">
                            Versão instalada
                          </Label>
                          <Input
                            id={`version-${item.id}`}
                            value={itemState.installedVersion}
                            onChange={(e) =>
                              updateField(item.id, "installedVersion", e.target.value)
                            }
                            placeholder="Ex.: 24.0.5"
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <Label htmlFor={`evidence-${item.id}`} className="text-xs">
                            Link de evidência (opcional)
                          </Label>
                          <Input
                            id={`evidence-${item.id}`}
                            value={itemState.evidenceUrl}
                            onChange={(e) => updateField(item.id, "evidenceUrl", e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                        <div className="flex items-center gap-2 sm:col-span-2">
                          <Checkbox
                            id={`review-${item.id}`}
                            checked={itemState.reviewNeeded}
                            onCheckedChange={(checked) =>
                              updateField(item.id, "reviewNeeded", checked === true)
                            }
                          />
                          <Label htmlFor={`review-${item.id}`} className="text-xs font-normal">
                            Marcar para revisão
                          </Label>
                        </div>
                        <div className="sm:col-span-2">
                          <Button type="button" size="sm" onClick={() => saveDetails(item.id)}>
                            Salvar detalhes
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
