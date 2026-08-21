"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Trash2, X } from "lucide-react";
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

type PreviewModule = { title: string; lessons: { title: string }[] };
type Preview = { title: string; modules: PreviewModule[] };

export function ImportPreviewForm() {
  const router = useRouter();
  const [rawText, setRawText] = React.useState("");
  const [rawJson, setRawJson] = React.useState("");
  const [preview, setPreview] = React.useState<Preview | null>(null);
  const [isPending, startTransition] = React.useTransition();

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

  function removeModule(index: number) {
    if (!preview) return;
    setPreview({ ...preview, modules: preview.modules.filter((_, i) => i !== index) });
  }

  function removeLesson(moduleIndex: number, lessonIndex: number) {
    if (!preview) return;
    const modules = preview.modules.map((m, i) =>
      i === moduleIndex ? { ...m, lessons: m.lessons.filter((_, j) => j !== lessonIndex) } : m
    );
    setPreview({ ...preview, modules });
  }

  function confirmImport() {
    if (!preview) return;
    const emptyModule = preview.modules.find((m) => m.lessons.length === 0);
    if (emptyModule) {
      toast.error(`O módulo "${emptyModule.title}" ficou sem aulas. Remova-o ou adicione aulas.`);
      return;
    }
    if (preview.modules.length === 0) {
      toast.error("Adicione ao menos um módulo antes de confirmar.");
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

  const totalLessons = preview?.modules.reduce((sum, m) => sum + m.lessons.length, 0) ?? 0;

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
            {preview.modules.map((courseModule, moduleIndex) => (
              <div key={moduleIndex} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-medium">{courseModule.title}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remover módulo "${courseModule.title}"`}
                    onClick={() => removeModule(moduleIndex)}
                  >
                    <Trash2 className="size-3.5 text-muted-foreground" />
                  </Button>
                </div>
                <ul className="mt-2 space-y-1">
                  {courseModule.lessons.map((lesson, lessonIndex) => (
                    <li
                      key={lessonIndex}
                      className="flex items-center justify-between gap-2 text-sm text-muted-foreground"
                    >
                      {lesson.title}
                      <button
                        type="button"
                        aria-label={`Remover aula "${lesson.title}"`}
                        onClick={() => removeLesson(moduleIndex, lessonIndex)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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
          Cole a estrutura do curso (gerada por IA ou escrita à mão) e revise antes de importar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="text">
          <TabsList>
            <TabsTrigger value="text">Texto</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>
          <TabsContent value="text" className="space-y-3">
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={TEXT_EXAMPLE}
              rows={12}
              className="font-mono text-sm"
            />
            <Button type="button" onClick={analyzeText} disabled={isPending || !rawText.trim()}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Analisar
            </Button>
          </TabsContent>
          <TabsContent value="json" className="space-y-3">
            <Textarea
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              placeholder={JSON_EXAMPLE}
              rows={12}
              className="font-mono text-sm"
            />
            <Button type="button" onClick={analyzeJson} disabled={isPending || !rawJson.trim()}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Analisar
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
