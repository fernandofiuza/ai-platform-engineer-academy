import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountNameForm } from "@/modules/account/components/account-name-form";
import { ChangePasswordForm } from "@/modules/account/components/change-password-form";

export const metadata: Metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const session = await auth();
  const user = await db.user.findUniqueOrThrow({
    where: { id: session!.user.id },
    select: { name: true, email: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Preferências da conta.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da conta</CardTitle>
          <CardDescription>Seu nome e e-mail de acesso.</CardDescription>
        </CardHeader>
        <CardContent>
          <AccountNameForm name={user.name} email={user.email} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Senha</CardTitle>
          <CardDescription>Altere a senha usada para entrar na plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
