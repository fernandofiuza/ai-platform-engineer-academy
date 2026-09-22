import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { storageProvider } from "@/lib/storage";

/** Serve um anexo de anotação — só dono, nunca em `public/`. O `Content-Type` devolvido é
 * sempre o `mimeType` já validado/normalizado salvo no banco (nunca o que o navegador mandou no
 * upload), com `nosniff` e sem `Content-Disposition: attachment` forçado — os tipos permitidos
 * (imagem, PDF, texto/markdown) são todos seguros para abrir inline, nunca HTML/script. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { attachmentId } = await params;
  const attachment = await db.noteAttachment.findUnique({
    where: { id: attachmentId },
    include: { note: { select: { userId: true } } },
  });

  if (!attachment || attachment.note.userId !== session.user.id) {
    return NextResponse.json({ error: "Anexo não encontrado." }, { status: 404 });
  }

  const buffer = await storageProvider.read(attachment.storageKey);
  if (!buffer) {
    return NextResponse.json({ error: "Arquivo não encontrado no armazenamento." }, { status: 404 });
  }

  const encodedName = encodeURIComponent(attachment.originalName);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `inline; filename="attachment"; filename*=UTF-8''${encodedName}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
