import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { FocusModeProvider } from "@/components/layout/focus-mode";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <FocusModeProvider>
      <AppShell
        user={{
          name: session.user.name ?? "Estudante",
          email: session.user.email ?? "",
          role: session.user.role,
        }}
      >
        {children}
      </AppShell>
    </FocusModeProvider>
  );
}
