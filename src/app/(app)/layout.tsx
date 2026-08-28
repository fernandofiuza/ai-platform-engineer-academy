import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
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

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });

  return (
    <FocusModeProvider>
      <AppShell
        user={{
          name: user?.name ?? session.user.name ?? "Estudante",
          email: user?.email ?? session.user.email ?? "",
          role: session.user.role,
        }}
      >
        {children}
      </AppShell>
    </FocusModeProvider>
  );
}
