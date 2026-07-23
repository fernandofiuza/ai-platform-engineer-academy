import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";

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
    <div className="min-h-screen">
      <AppSidebar />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <AppTopbar
          user={{
            name: session.user.name ?? "Estudante",
            email: session.user.email ?? "",
            role: session.user.role,
          }}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
