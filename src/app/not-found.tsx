import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Compass className="size-6" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">Página não encontrada</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        O endereço acessado não existe ou ainda não foi implementado.
      </p>
      <Button asChild>
        <Link href="/dashboard">Voltar ao início</Link>
      </Button>
    </div>
  );
}
