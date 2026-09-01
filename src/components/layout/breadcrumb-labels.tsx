"use client";

import * as React from "react";

type LabelMap = Record<string, string>;

const BreadcrumbLabelsContext = React.createContext<{
  labels: LabelMap;
  setLabel: (segment: string, label: string) => void;
} | null>(null);

export function BreadcrumbLabelsProvider({ children }: { children: React.ReactNode }) {
  const [labels, setLabels] = React.useState<LabelMap>({});

  const setLabel = React.useCallback((segment: string, label: string) => {
    setLabels((prev) => (prev[segment] === label ? prev : { ...prev, [segment]: label }));
  }, []);

  return (
    <BreadcrumbLabelsContext.Provider value={{ labels, setLabel }}>
      {children}
    </BreadcrumbLabelsContext.Provider>
  );
}

export function useBreadcrumbLabels() {
  const ctx = React.useContext(BreadcrumbLabelsContext);
  return ctx?.labels ?? {};
}

/** Renderizado por páginas com segmentos dinâmicos na URL (ids) pra registrar o nome
 * legível (título do curso, da aula, etc.) que a breadcrumb do topo deve mostrar no
 * lugar do id cru. */
export function BreadcrumbLabel({ segment, label }: { segment: string; label: string }) {
  const ctx = React.useContext(BreadcrumbLabelsContext);
  React.useEffect(() => {
    ctx?.setLabel(segment, label);
  }, [ctx, segment, label]);
  return null;
}
