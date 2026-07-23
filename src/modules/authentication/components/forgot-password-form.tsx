"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordResetAction } from "../actions";

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [isPending, startTransition] = React.useTransition();
  const [submitted, setSubmitted] = React.useState(false);
  const [devResetUrl, setDevResetUrl] = React.useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await requestPasswordResetAction({ email });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setSubmitted(true);
      setDevResetUrl(result.devResetUrl ?? null);
    });
  }

  if (submitted) {
    return (
      <div className="space-y-3">
        <Alert>
          <AlertDescription>
            Se existir uma conta com esse e-mail, enviamos um link de redefinição de senha.
          </AlertDescription>
        </Alert>
        {devResetUrl ? (
          <Alert variant="destructive">
            <AlertDescription className="break-all">
              <strong>Modo de desenvolvimento</strong> (nenhum e-mail é enviado de verdade):{" "}
              <a href={devResetUrl} className="underline">
                {devResetUrl}
              </a>
            </AlertDescription>
          </Alert>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="forgot-email">E-mail</Label>
        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending || !email}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Enviar link de redefinição
      </Button>
    </form>
  );
}
