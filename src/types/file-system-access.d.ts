// Tipos mínimos da File System Access API (showDirectoryPicker) — ainda não incluída no
// lib.dom.d.ts do TypeScript. Só o suficiente para o escaneamento de pasta no Study Hub
// (src/modules/study-hub/folder-scan.ts).
export {};

declare global {
  interface FileSystemHandle {
    readonly kind: "file" | "directory";
    readonly name: string;
  }

  interface FileSystemFileHandle extends FileSystemHandle {
    readonly kind: "file";
    getFile(): Promise<File>;
  }

  interface FileSystemDirectoryHandle extends FileSystemHandle {
    readonly kind: "directory";
    entries(): AsyncIterableIterator<[string, FileSystemDirectoryHandle | FileSystemFileHandle]>;
  }

  interface Window {
    showDirectoryPicker?(options?: { mode?: "read" | "readwrite" }): Promise<FileSystemDirectoryHandle>;
  }
}
