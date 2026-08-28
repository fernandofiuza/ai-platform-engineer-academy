import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/modules/profile/components/profile-form";

export const metadata: Metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const session = await auth();
  const [user, profile] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: session!.user.id },
      select: { name: true, email: true },
    }),
    db.profile.findUnique({
      where: { userId: session!.user.id },
      select: { bio: true, timezone: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dados pessoais e preferências de estudo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{user.name}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm bio={profile?.bio ?? null} timezone={profile?.timezone ?? "America/Sao_Paulo"} />
        </CardContent>
      </Card>
    </div>
  );
}
