"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateManualCommitCountAction } from "@/modules/dashboard/actions";

export function CommitCountEditor({ initialCount }: { initialCount: number }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(String(initialCount));

  function onSave() {
    const count = Number(value);
    if (!Number.isInteger(count) || count < 0) {
      toast.error("Informe um número inteiro válido.");
      return;
    }
    startTransition(async () => {
      const result = await updateManualCommitCountAction(count);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        Editar quantidade
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 w-24"
      />
      <Button type="button" size="sm" onClick={onSave} disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
      </Button>
    </div>
  );
}
