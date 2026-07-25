"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

type FocusModeContextValue = {
  focusMode: boolean;
  setFocusMode: (value: boolean) => void;
};

const FocusModeContext = React.createContext<FocusModeContextValue | null>(null);

/** Contexto global (não persistido) pro "modo foco" — some com a sidebar/topbar do app enquanto
 * o aluno lê uma aula. Sai automaticamente ao navegar pra fora de `/learn/*` (ex.: botão voltar
 * do navegador), pra nunca deixar o aluno preso sem navegação visível. */
export function FocusModeProvider({ children }: { children: React.ReactNode }) {
  const [focusMode, setFocusMode] = React.useState(false);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = React.useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (focusMode && !pathname.startsWith("/learn/")) {
      setFocusMode(false);
    }
  }

  const value = React.useMemo(() => ({ focusMode, setFocusMode }), [focusMode]);

  return <FocusModeContext.Provider value={value}>{children}</FocusModeContext.Provider>;
}

export function useFocusMode() {
  const ctx = React.useContext(FocusModeContext);
  if (!ctx) throw new Error("useFocusMode deve ser usado dentro de FocusModeProvider.");
  return ctx;
}
