"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Award, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { requestCertificationAction } from "@/modules/certifications/actions";

export function CertificationRequestButton({ phaseId }: { phaseId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function onRequest() {
    startTransition(async () => {
      const result = await requestCertificationAction(phaseId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Certificado emitido!");
      router.refresh();
    });
  }

  return (
    <Button size="sm" onClick={onRequest} disabled={isPending}>
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Award className="size-4" />}
      Emitir certificado
    </Button>
  );
}
