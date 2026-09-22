// Regras de anexo de anotação: tipos permitidos, tamanho máximo, e sanitização de nome —
// centralizadas aqui porque precisam valer tanto no client (feedback imediato) quanto no server
// (única fonte de verdade real; o client nunca é confiável). O `mimeType` armazenado/servido
// nunca vem do que o navegador reportou no upload — vem sempre deste mapa, indexado pela
// extensão do nome sanitizado, pra nunca servir um content-type que o cliente escolheu.

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_ATTACHMENT_EXTENSIONS: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
};

export function sanitizeFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "arquivo";
  const cleaned = base
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9.\-_ ]/g, "")
    .trim();
  return (cleaned || "arquivo").slice(0, 150);
}

export function getAttachmentExtension(sanitizedName: string): string | null {
  const match = sanitizedName.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : null;
}

/** Única fonte de verdade sobre se um arquivo pode ser anexado — usada no client (feedback
 * imediato) e obrigatoriamente revalidada no server action (`actions.ts`). */
export function validateAttachment(file: { name: string; size: number }):
  | { ok: true; sanitizedName: string; extension: string; mimeType: string }
  | { ok: false; error: string } {
  if (file.size <= 0) return { ok: false, error: "Arquivo vazio." };
  if (file.size > MAX_ATTACHMENT_SIZE) {
    return { ok: false, error: "Arquivo maior que 10MB." };
  }

  const sanitizedName = sanitizeFilename(file.name);
  const extension = getAttachmentExtension(sanitizedName);
  const mimeType = extension ? ALLOWED_ATTACHMENT_EXTENSIONS[extension] : undefined;
  if (!extension || !mimeType) {
    return {
      ok: false,
      error: "Tipo de arquivo não permitido. Use imagem (jpg, png, webp), PDF ou texto/markdown.",
    };
  }

  return { ok: true, sanitizedName, extension, mimeType };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
