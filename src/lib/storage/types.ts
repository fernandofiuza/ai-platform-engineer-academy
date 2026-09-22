// Interface desacoplada de armazenamento de arquivos — mesma ideia do `AIProvider`
// (`src/modules/artificial-intelligence/types.ts`): domínio (aqui, `notes`) nunca toca disco/S3
// diretamente, só fala com `FileStorageProvider`. Hoje só existe `LocalFileStorageProvider`
// (`local-provider.ts`); trocar por S3/R2 no futuro é implementar essa interface de novo e
// trocar o export em `index.ts` — nenhuma mudança em `modules/notes`.

export type StoredFile = {
  /** Chave opaca do arquivo no storage — nunca deriva do nome original enviado pelo usuário,
   * nunca é usada como caminho sem passar pelo provider (evita path traversal). */
  key: string;
  size: number;
};

export interface FileStorageProvider {
  save(input: { buffer: Buffer; extension: string }): Promise<StoredFile>;
  read(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
}
