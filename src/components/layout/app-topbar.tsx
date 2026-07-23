import { MobileNav } from "@/components/layout/mobile-nav";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";

export function AppTopbar({
  user,
}: {
  user: { name: string; email: string; role: "STUDENT" | "ADMIN" };
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur supports-backdrop-filter:bg-background/60 sm:px-6">
      <MobileNav />
      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>
      <ThemeToggle />
      <UserMenu name={user.name} email={user.email} role={user.role} />
    </header>
  );
}
