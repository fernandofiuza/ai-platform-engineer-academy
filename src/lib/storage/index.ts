import { LocalFileStorageProvider } from "./local-provider";
import type { FileStorageProvider } from "./types";

export type { FileStorageProvider, StoredFile } from "./types";

export const storageProvider: FileStorageProvider = new LocalFileStorageProvider();
