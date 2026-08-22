"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, FolderOpen, Loader2, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  commitExternalCourseImportAction,
  previewImportFromJsonAction,
  previewImportFromTextAction,
} from "@/modules/study-hub/actions";
import { isFolderImportSupported, isSecureContext, scanCourseFolder } from "@/modules/study-hub/folder-scan";

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const TEXT_EXAMPLE = `CURSO:
Formação AWS 5.0

PASTA:
01 - Introdução

AULAS:
01 - Apresentação
02 - Conceitos de Cloud
03 - AWS

PASTA:
02 - IAM

AULAS:
01 - Users
02 - Groups
03 - Policies
04 - Roles`;

const JSON_EXAMPLE = `{
  "course": "Formação AWS 5.0",
  "modules": [
    {
      "name": "01 - Introdução",
      "lessons": ["01 - Apresentação", "02 - Conceitos de Cloud"]
    },
    {
      "name": "02 - IAM",
      "lessons": ["01 - Users", "02 - Groups", "03 - Policies", "04 - Roles"]
    }
  ]
}`;

type PreviewModule = { title: string; lessons: { title: string }[]; modules: PreviewModule[] };
type Preview = { title: string; modules: PreviewModule[] };

function countLessons(modules: PreviewModule[]): number {
  return modules.reduce((sum, m) => sum + m.lessons.length + countLessons(m.modules), 0);
}

function findEmptyModule(modules: PreviewModule[]): PreviewModule | null {
  for (const m of modules) {
    if (m.lessons.length === 0 && m.modules.length === 0) return m;
    const nested = findEmptyModule(m.modules);
    if (nested) return nested;
  }
  return null;
}

function removeModuleAtPath(modules: PreviewModule[], path: number[]): PreviewModule[] {
  const [index, ...rest] = path;
  if (rest.length === 0) return modules.filter((_, i) => i !== index);
  return modules.map((m, i) => (i === index ? { ...m, modules: removeModuleAtPath(m.modules, rest) } : m));
}

function removeLessonAtPath(modules: PreviewModule[], modulePath: number[], lessonIndex: number): PreviewModule[] {
  const [index, ...rest] = modulePath;
  return modules.map((m, i) => {
    if (i !== index) return m;
    if (rest.length === 0) return { ...m, lessons: m.lessons.filter((_, j) => j !== lessonIndex) };
    return { ...m, modules: removeLessonAtPath(m.modules, rest, lessonIndex) };
  });
}

export function ImportPreviewForm() {
  const router = useRouter();
  const [rawText, setRawText] = React.useState("");
  const [rawJson, setRawJson] = React.useState("");
  const [preview, setPreview] = React.useState<Preview | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [isScanningFolder, setIsScanningFolder] = React.useState(false);
  const folderSupported = React.useSyncExternalStore(
    () => () => {},
    isFolderImportSupported,
    () => false
  );
  const secureContext = React.useSyncExternalStore(
    () => () => {},
    isSecureContext,
    () => true
  );

  async function pickFolder() {
    if (!window.showDirectoryPicker) return;
    setIsScanningFolder(true);
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: "read" });
      const result = await scanCourseFolder(dirHandle);
      if (result.modules.length === 0) {
        toast.error("Nenhum arquivo encontrado nessa pasta.");
        return;
      }
      setPreview(result);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("[study-hub] falha ao ler pasta local:", err);
      toast.error("Não consegui ler a pasta selecionada.");
    } finally {
      setIsScanningFolder(false);
    }
  }

  function analyzeText() {
    startTransition(async () => {
      const result = await previewImportFromTextAction({ rawText });
      if (result.error || !result.preview) {
        toast.error(result.error ?? "Não consegui interpretar o texto.");
        return;
      }
      setPreview(result.preview);
    });
  }

  function analyzeJson() {
    startTransition(async () => {
      const result = await previewImportFromJsonAction({ rawJson });
      if (result.error || !result.preview) {
        toast.error(result.error ?? "Não consegui interpretar o JSON.");
        return;
      }
      setPreview(result.preview);
    });
  }

  function removeModule(path: number[]) {
    if (!preview) return;
    setPreview({ ...preview, modules: removeModuleAtPath(preview.modules, path) });
  }

  function removeLesson(modulePath: number[], lessonIndex: number) {
    if (!preview) return;
    setPreview({ ...preview, modules: removeLessonAtPath(preview.modules, modulePath, lessonIndex) });
  }

  function confirmImport() {
    if (!preview) return;
    if (preview.modules.length === 0) {
      toast.error("Adicione ao menos um módulo antes de confirmar.");
      return;
    }
    const emptyModule = findEmptyModule(preview.modules);
    if (emptyModule) {
      toast.error(`O módulo "${emptyModule.title}" ficou sem aulas. Remova-o ou adicione aulas.`);
      return;
    }
    startTransition(async () => {
      const result = await commitExternalCourseImportAction(preview);
      if (result.error || !result.courseId) {
        toast.error(result.error ?? "Não consegui importar o curso.");
        return;
      }
      toast.success("Curso importado.");
      router.push(`/study-hub/courses/${result.courseId}`);
    });
  }

  const totalLessons = preview ? countLessons(preview.modules) : 0;

  function renderModuleTree(mod: PreviewModule, path: number[]) {
    const depth = path.length - 1;
    return (
      <div
        key={path.join("-")}
        className={depth > 0 ? "border-l pl-3" : "rounded-lg border p-3"}
        style={depth > 0 ? { marginLeft: depth * 16 } : undefined}
      >
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-medium">{mod.title}</h4>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Remover módulo "${mod.title}"`}
            onClick={() => removeModule(path)}
          >
            <Trash2 className="size-3.5 text-muted-foreground" />
          </Button>
        </div>
        {mod.lessons.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {mod.lessons.map((lesson, lessonIndex) => (
              <li
                key={lessonIndex}
                className="flex items-center justify-between gap-2 text-sm text-muted-foreground"
              >
                {lesson.title}
                <button
                  type="button"
                  aria-label={`Remover aula "${lesson.title}"`}
                  onClick={() => removeLesson(path, lessonIndex)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {mod.modules.length > 0 ? (
          <div className="mt-3 space-y-3">
            {mod.modules.map((child, childIndex) => renderModuleTree(child, [...path, childIndex]))}
          </div>
        ) : null}
      </div>
    );
  }

  if (preview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Confirme a estrutura importada</CardTitle>
          <CardDescription>
            Revise antes de confirmar — remova o que não quiser trazer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="import-title">Nome do curso</Label>
            <Input
              id="import-title"
              value={preview.title}
              onChange={(e) => setPreview({ ...preview, title: e.target.value })}
            />
          </div>

          <p className="text-sm text-muted-foreground">
            {preview.modules.length} módulo(s) · {totalLessons} aula(s)
          </p>

          <div className="space-y-4">
            {preview.modules.map((courseModule, moduleIndex) => renderModuleTree(courseModule, [moduleIndex]))}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setPreview(null)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="button" onClick={confirmImport} disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirmar importação
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4" /> Importar curso externo
        </CardTitle>
        <CardDescription>
          Selecione a pasta do curso, ou cole o texto/JSON à mão — sempre com prévia editável
          antes de importar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="folder">
          <TabsList>
            <TabsTrigger value="folder">Pasta local</TabsTrigger>
            <TabsTrigger value="text">Texto</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>
          <TabsContent value="folder" className="space-y-3">
            {folderSupported ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Selecione a pasta do curso no seu computador — o Apex lê os nomes dos arquivos
                  (vídeos, PDFs, imagens, o que tiver) e monta a estrutura automaticamente. Nenhum
                  arquivo é enviado a lugar nenhum, só os nomes são lidos.
                </p>
                <Button type="button" onClick={pickFolder} disabled={isScanningFolder}>
                  {isScanningFolder ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <FolderOpen className="size-4" />
                  )}
                  Selecionar pasta
                </Button>
              </>
            ) : !secureContext ? (
              <p className="text-sm text-muted-foreground">
                Essa opção só funciona em uma conexão segura (HTTPS) — o site atual está em HTTP
                puro, então o navegador não libera esse recurso mesmo no Chrome/Edge. Use a aba
                Texto ou JSON por aqui, ou acesse o Apex por um domínio com HTTPS.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Essa opção depende de um recurso disponível só no Chrome e no Edge — use a aba
                Texto ou JSON por aqui.
              </p>
            )}
          </TabsContent>
          <TabsContent value="text" className="space-y-3">
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={TEXT_EXAMPLE}
              rows={12}
              className="font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button type="button" onClick={analyzeText} disabled={isPending || !rawText.trim()}>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Analisar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => downloadTextFile("modelo-curso.txt", TEXT_EXAMPLE, "text/plain")}
              >
                <Download className="size-4" /> Baixar modelo
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="json" className="space-y-3">
            <Textarea
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              placeholder={JSON_EXAMPLE}
              rows={12}
              className="font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button type="button" onClick={analyzeJson} disabled={isPending || !rawJson.trim()}>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Analisar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => downloadTextFile("modelo-curso.json", JSON_EXAMPLE, "application/json")}
              >
                <Download className="size-4" /> Baixar modelo
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
