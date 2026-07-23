"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Square, Trash2, Loader2, Timer as TimerIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  discardSessionAction,
  finishSessionAction,
  pauseSessionAction,
  resumeSessionAction,
  startSessionAction,
} from "@/modules/study-sessions/actions";

type ActiveSession = {
  id: string;
  startedAt: Date;
  pausedAt: Date | null;
  totalPausedSeconds: number;
  lesson: { id: string; title: string } | null;
};

function formatElapsed(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function SessionTimer({ initialSession }: { initialSession: ActiveSession | null }) {
  const router = useRouter();
  const [prevInitialSession, setPrevInitialSession] = React.useState(initialSession);
  const [active, setActive] = React.useState(initialSession);
  const [elapsed, setElapsed] = React.useState(0);
  const [isPending, startTransition] = React.useTransition();
  const [showFinishForm, setShowFinishForm] = React.useState(false);
  const [focusRating, setFocusRating] = React.useState("3");
  const [difficultyRating, setDifficultyRating] = React.useState("3");
  const [notes, setNotes] = React.useState("");
  const [completedContent, setCompletedContent] = React.useState(false);

  if (initialSession !== prevInitialSession) {
    setPrevInitialSession(initialSession);
    setActive(initialSession);
  }

  React.useEffect(() => {
    function tick() {
      if (!active) {
        setElapsed(0);
        return;
      }
      const base = active.pausedAt ? active.pausedAt.getTime() : Date.now();
      const seconds = Math.max(
        0,
        Math.round((base - active.startedAt.getTime()) / 1000) - active.totalPausedSeconds
      );
      setElapsed(seconds);
    }
    tick();
    if (active?.pausedAt) return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [active]);

  function onStart() {
    startTransition(async () => {
      const result = await startSessionAction({});
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function onPause() {
    if (!active) return;
    startTransition(async () => {
      const result = await pauseSessionAction(active.id);
      if (result.error) toast.error(result.error);
      router.refresh();
    });
  }

  function onResume() {
    if (!active) return;
    startTransition(async () => {
      const result = await resumeSessionAction(active.id);
      if (result.error) toast.error(result.error);
      router.refresh();
    });
  }

  function onFinish() {
    if (!active) return;
    startTransition(async () => {
      const result = await finishSessionAction({
        sessionId: active.id,
        focusRating: Number(focusRating),
        difficultyRating: Number(difficultyRating),
        notes: notes || undefined,
        completedContent,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Sessão registrada.");
      setShowFinishForm(false);
      setNotes("");
      router.refresh();
    });
  }

  function onDiscard() {
    if (!active) return;
    startTransition(async () => {
      const result = await discardSessionAction(active.id);
      if (result.error) toast.error(result.error);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TimerIcon className="size-4" /> Cronômetro de estudo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="font-mono text-4xl font-semibold tabular-nums">
          {formatElapsed(elapsed)}
        </div>

        {!active ? (
          <Button onClick={onStart} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            Iniciar sessão
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {active.pausedAt ? (
              <Button onClick={onResume} disabled={isPending} variant="outline">
                <Play className="size-4" /> Continuar
              </Button>
            ) : (
              <Button onClick={onPause} disabled={isPending} variant="outline">
                <Pause className="size-4" /> Pausar
              </Button>
            )}
            <Button onClick={() => setShowFinishForm((v) => !v)} disabled={isPending}>
              <Square className="size-4" /> Finalizar
            </Button>
            <Button onClick={onDiscard} disabled={isPending} variant="ghost">
              <Trash2 className="size-4" /> Descartar
            </Button>
          </div>
        )}

        {active && showFinishForm ? (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Foco percebido</Label>
                <Select value={focusRating} onValueChange={setFocusRating}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Dificuldade percebida</Label>
                <Select value={difficultyRating} onValueChange={setDifficultyRating}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="completedContent"
                checked={completedContent}
                onCheckedChange={(checked) => setCompletedContent(checked === true)}
              />
              <Label htmlFor="completedContent" className="text-sm font-normal">
                Concluí o conteúdo planejado nesta sessão
              </Label>
            </div>
            <Button onClick={onFinish} disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Salvar e finalizar
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
