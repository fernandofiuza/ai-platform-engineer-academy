import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { FileStorageProvider, StoredFile } from "./types";

// Fora de `public/` de propósito — só alcançável pelo route handler autenticado
// (`/api/notes/attachments/[id]`), nunca servido estaticamente pelo Next. Configurável via
// `NOTES_STORAGE_DIR` para apontar a um volume Docker em produção (ver docker-compose.yml).
const BASE_DIR = path.resolve(process.cwd(), process.env.NOTES_STORAGE_DIR || ".data/note-attachments");

/** Só aceita chaves que nós mesmos geramos (`save`) — `extension` já vem validada contra um
 * allowlist antes de chegar aqui (`modules/notes/attachments.ts`), mas revalidamos por defesa em
 * profundidade contra path traversal caso algum chamador futuro passe algo inesperado. */
function assertSafeKey(key: string) {
  if (!/^[a-zA-Z0-9-]+\.[a-zA-Z0-9]{1,10}$/.test(key)) {
    throw new Error("Chave de armazenamento inválida.");
  }
}

export class LocalFileStorageProvider implements FileStorageProvider {
  async save(input: { buffer: Buffer; extension: string }): Promise<StoredFile> {
    const extension = input.extension.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (!extension) throw new Error("Extensão de arquivo inválida.");

    const key = `${randomUUID()}.${extension}`;
    assertSafeKey(key);

    await mkdir(BASE_DIR, { recursive: true });
    await writeFile(path.join(BASE_DIR, key), input.buffer);

    return { key, size: input.buffer.byteLength };
  }

  async read(key: string): Promise<Buffer | null> {
    assertSafeKey(key);
    try {
      return await readFile(path.join(BASE_DIR, key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    assertSafeKey(key);
    await rm(path.join(BASE_DIR, key), { force: true });
  }
}
