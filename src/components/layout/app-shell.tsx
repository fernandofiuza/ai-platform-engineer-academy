"use client";

import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { useFocusMode } from "@/components/layout/focus-mode";

export function AppShell({
  user,
  children,
}: {
  user: { name: string; email: string; role: "STUDENT" | "ADMIN" };
  children: React.ReactNode;
}) {
  const { focusMode } = useFocusMode();

  return (
    <div className="min-h-screen">
      {focusMode ? null : <AppSidebar />}
      <div className={cn("flex min-h-screen flex-col", !focusMode && "lg:pl-64")}>
        {focusMode ? null : <AppTopbar user={user} />}
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
