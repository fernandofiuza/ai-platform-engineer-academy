import Link from "next/link";
import { GraduationCap } from "lucide-react";

import { NavLinks } from "@/components/layout/nav-links";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <GraduationCap className="size-4.5" />
          </span>
          <span className="text-sm">AI Platform Engineer</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <NavLinks />
      </ScrollArea>
    </aside>
  );
}
