"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("unhandled route error", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">Algo deu errado</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Ocorreu um erro inesperado. Você pode tentar novamente ou voltar mais tarde.
      </p>
      <Button onClick={() => reset()}>Tentar novamente</Button>
    </div>
  );
}
