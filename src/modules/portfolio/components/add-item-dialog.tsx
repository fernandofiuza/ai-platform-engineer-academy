"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addPortfolioItemAction } from "@/modules/portfolio/actions";

export function AddItemDialog({ projectOptions }: { projectOptions: { id: string; title: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [repoUrl, setRepoUrl] = React.useState("");
  const [projectId, setProjectId] = React.useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await addPortfolioItemAction({ repoUrl, projectId: projectId || undefined });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Repositório adicionado.");
      setOpen(false);
      setRepoUrl("");
      setProjectId("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Adicionar repositório
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo repositório no portfólio</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="repo-url">URL do repositório</Label>
            <Input
              id="repo-url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/usuario/projeto"
              required
            />
          </div>
          {projectOptions.length > 0 ? (
            <div className="space-y-1.5">
              <Label>Vincular a um projeto (opcional)</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  {projectOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={isPending || !repoUrl}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
