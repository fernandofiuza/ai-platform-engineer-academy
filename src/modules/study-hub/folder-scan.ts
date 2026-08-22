// Escaneamento de pasta local via File System Access API — roda inteiramente no navegador.
// Só o navegador lê os nomes dos arquivos; nada é enviado ao servidor. Disponível apenas
// em Chrome/Edge (`isFolderImportSupported` deve ser checado antes de chamar `showDirectoryPicker`).

// Aceita qualquer arquivo do curso (vídeo, PDF, imagem, slide, etc) — só ignora arquivos de
// sistema/lixo que o SO cria sozinho, nunca conteúdo real do curso.
const IGNORED_FILE_NAMES = new Set([".ds_store", "thumbs.db", "desktop.ini"]);

function isIgnoredFile(name: string) {
  const lower = name.toLowerCase();
  return IGNORED_FILE_NAMES.has(lower) || lower.startsWith(".");
}

export function isFolderImportSupported() {
  return typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";
}

/** Só remove o que vem depois do último ponto se parecer mesmo uma extensão de arquivo — começa
 * com letra, até 5 caracteres (ex.: "mp4", "m4v", "pdf", "docx"; começar com letra é o que
 * diferencia de um número de versão puro, ex.: "Formação AWS 5.0" não deve virar "Formação AWS 5"
 * porque ".0" começa com dígito, não com letra). */
function stripFileExtension(name: string) {
  const idx = name.lastIndexOf(".");
  if (idx <= 0) return name;
  const ext = name.slice(idx + 1);
  return /^[a-zA-Z][a-zA-Z0-9]{0,4}$/.test(ext) ? name.slice(0, idx) : name;
}

/** "01 - Introdução.mp4" -> "Introdução". Remove extensão de arquivo, prefixo numérico
 * ("01 - "/"01_"/"01."/"01) ") e troca "_" por espaço. */
export function cleanFileName(rawName: string): string {
  const withoutExt = stripFileExtension(rawName);
  const withoutPrefix = withoutExt.replace(/^\s*\d+\s*[-_.)]\s*/, "");
  const cleaned = withoutPrefix.replace(/_/g, " ").trim();
  return cleaned || withoutExt.trim() || rawName;
}

function naturalCompare(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

async function listContentFileNames(dirHandle: FileSystemDirectoryHandle): Promise<string[]> {
  const names: string[] = [];
  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind === "file" && !isIgnoredFile(name)) names.push(name);
  }
  return names.sort(naturalCompare);
}

async function listSubfolders(dirHandle: FileSystemDirectoryHandle) {
  const folders: { name: string; handle: FileSystemDirectoryHandle }[] = [];
  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind === "directory") folders.push({ name, handle: handle as FileSystemDirectoryHandle });
  }
  return folders.sort((a, b) => naturalCompare(a.name, b.name));
}

export type ScannedModule = {
  title: string;
  lessons: { title: string }[];
  /** Submódulos — espelha subpastas dentro da pasta deste módulo, em qualquer profundidade. */
  modules: ScannedModule[];
};

export type ScannedPreview = {
  title: string;
  modules: ScannedModule[];
};

// Limite de segurança pra não entrar em loop com uma árvore de pastas absurdamente funda (ex.:
// o usuário selecionar sem querer uma pasta como node_modules) — cursos reais nunca chegam perto.
const MAX_DEPTH = 8;

/** Monta a árvore de um módulo (e seus submódulos) recursivamente, espelhando a estrutura real
 * de pastas: arquivos direto na pasta viram `lessons`, subpastas viram `modules` (submódulos).
 * Retorna `null` quando a pasta (e tudo dentro dela) não tem nenhum arquivo em lugar nenhum —
 * pasta puramente vazia é descartada, não vira um módulo fantasma. */
async function buildModuleNode(dirHandle: FileSystemDirectoryHandle, depth: number): Promise<ScannedModule | null> {
  if (depth > MAX_DEPTH) return null;

  const fileNames = await listContentFileNames(dirHandle);
  const subfolders = await listSubfolders(dirHandle);

  const childModules: ScannedModule[] = [];
  for (const folder of subfolders) {
    const child = await buildModuleNode(folder.handle, depth + 1);
    if (child) childModules.push(child);
  }

  if (fileNames.length === 0 && childModules.length === 0) return null;

  return {
    title: cleanFileName(dirHandle.name),
    lessons: fileNames.map((name) => ({ title: cleanFileName(name) })),
    modules: childModules,
  };
}

/**
 * Arquivos soltos direto na raiz da pasta selecionada viram um módulo único ("Módulo 1").
 * Cada subpasta de primeiro nível vira um módulo próprio, com sua própria subárvore de
 * submódulos preservada (ver `buildModuleNode`) — a hierarquia real de pastas não é achatada.
 */
export async function scanCourseFolder(dirHandle: FileSystemDirectoryHandle): Promise<ScannedPreview> {
  const courseTitle = cleanFileName(dirHandle.name);
  const modules: ScannedModule[] = [];

  const rootFileNames = await listContentFileNames(dirHandle);
  if (rootFileNames.length > 0) {
    modules.push({
      title: "Módulo 1",
      lessons: rootFileNames.map((name) => ({ title: cleanFileName(name) })),
      modules: [],
    });
  }

  const subfolders = await listSubfolders(dirHandle);
  for (const folder of subfolders) {
    const child = await buildModuleNode(folder.handle, 1);
    if (child) modules.push(child);
  }

  return { title: courseTitle, modules };
}
