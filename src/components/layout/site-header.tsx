import Link from "next/link";
import { GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-white">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-4.5" />
          </span>
          <span className="hidden sm:inline">AI Platform Engineer Academy</span>
          <span className="sm:hidden">APEA</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            className="text-white/80 hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link href="/login">Entrar</Link>
          </Button>
          <Button className="rounded-full bg-primary px-4 hover:bg-primary/90" asChild>
            <Link href="/register">Criar conta</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
