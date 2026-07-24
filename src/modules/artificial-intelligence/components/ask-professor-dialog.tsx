"use client";

import * as React from "react";
import { AlertTriangle, GraduationCap, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/markdown";
import { converseAction } from "@/modules/artificial-intelligence/actions";
import { AI_DISCLAIMER } from "@/modules/artificial-intelligence/types";

export function AskProfessorDialog({ lessonId }: { lessonId: string }) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [message, setMessage] = React.useState("");
  const [response, setResponse] = React.useState<string | null>(null);

  function onAsk() {
    startTransition(async () => {
      const result = await converseAction({ persona: "PROFESSOR", message, lessonId });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setResponse((result.result as { response: string }).response);
    });
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setMessage("");
      setResponse(null);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Sparkles className="size-4" /> Pergunte ao Professor
      </Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="size-4" /> Pergunte ao Professor
            </DialogTitle>
            <DialogDescription>
              Tire sua dúvida sobre esta aula — a persona Professor responde com base no
              conteúdo que você acabou de ler.
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="O que você não entendeu, ou sobre o que quer saber mais?"
              rows={3}
              autoFocus
            />
            <Button onClick={onAsk} disabled={isPending || !message.trim()} className="w-fit">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Perguntar
            </Button>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
              {response ? (
                <div className="space-y-2 rounded-lg border p-3">
                  <Markdown content={response} />
                </div>
              ) : null}

              <Alert>
                <AlertTriangle className="size-4" />
                <AlertDescription>{AI_DISCLAIMER}</AlertDescription>
              </Alert>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
