import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ForgotPasswordForm } from "@/modules/authentication/components/forgot-password-form";

export const metadata: Metadata = { title: "Esqueci minha senha" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Esqueci minha senha</CardTitle>
          <CardDescription>
            Informe seu e-mail para receber um link de redefinição de senha.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ForgotPasswordForm />
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-foreground hover:underline">
              Voltar para o login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
