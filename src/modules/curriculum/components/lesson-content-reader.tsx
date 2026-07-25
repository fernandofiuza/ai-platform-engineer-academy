"use client";

import * as React from "react";
import { Maximize2, Minimize2, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Markdown, type MarkdownSize } from "@/components/markdown";
import { useFocusMode } from "@/components/layout/focus-mode";

const SIZES: MarkdownSize[] = ["sm", "base", "lg", "xl"];
const SIZE_LABELS: Record<MarkdownSize, string> = {
  sm: "Pequena",
  base: "Normal",
  lg: "Grande",
  xl: "Extra grande",
};
const STORAGE_KEY = "apea:lesson-font-size";
// Evento local (não é o `storage` nativo, que só dispara em OUTRAS abas) para o próprio componente
// se re-renderizar assim que o usuário troca o tamanho, via `useSyncExternalStore`.
const CHANGE_EVENT = "apea:lesson-font-size-change";

function isMarkdownSize(value: string | null): value is MarkdownSize {
  return value !== null && (SIZES as string[]).includes(value);
}

function readStoredSize(): MarkdownSize {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isMarkdownSize(stored) ? stored : "sm";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function getServerSnapshot(): MarkdownSize {
  return "sm";
}

/** Controle de tamanho de fonte do conteúdo da aula, persistido no navegador (não é preferência
 * de conta, só de leitura local) — a pedido do usuário, para melhorar a leitura de aulas longas.
 * Usa `useSyncExternalStore` (em vez de `useState` + `useEffect`) para ler o `localStorage` sem
 * causar mismatch de hidratação: o servidor sempre "vê" o tamanho padrão, e o valor real só é
 * lido no cliente. */
export function LessonContentReader({ content }: { content: string }) {
  const size = React.useSyncExternalStore(subscribe, readStoredSize, getServerSnapshot);
  const { focusMode, setFocusMode } = useFocusMode();

  function updateSize(next: MarkdownSize) {
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  const index = SIZES.indexOf(size);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setFocusMode(!focusMode)}
        >
          {focusMode ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          {focusMode ? "Sair do modo foco" : "Modo foco"}
        </Button>
        <span className="text-xs text-muted-foreground">Tamanho do texto: {SIZE_LABELS[size]}</span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Diminuir fonte"
            disabled={index === 0}
            onClick={() => updateSize(SIZES[Math.max(0, index - 1)])}
          >
            <Minus className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Aumentar fonte"
            disabled={index === SIZES.length - 1}
            onClick={() => updateSize(SIZES[Math.min(SIZES.length - 1, index + 1)])}
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      </div>
      <Markdown content={content} size={size} />
    </div>
  );
}
