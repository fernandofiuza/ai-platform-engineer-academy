export const QUALITY_CHECKLIST_ITEMS = [
  { key: "readme", label: "README completo" },
  { key: "description", label: "Descrição do repositório" },
  { key: "install", label: "Instruções de instalação" },
  { key: "architecture", label: "Arquitetura documentada" },
  { key: "diagrams", label: "Diagramas" },
  { key: "tests", label: "Testes" },
  { key: "docker", label: "Docker" },
  { key: "ci", label: "CI/CD" },
  { key: "releases", label: "Releases" },
  { key: "changelog", label: "Changelog" },
  { key: "license", label: "Licença" },
  { key: "roadmap", label: "Roadmap" },
  { key: "issues", label: "Issues organizadas" },
  { key: "commits", label: "Commits claros" },
] as const;

export type QualityChecklist = Record<string, boolean>;

export function emptyChecklist(): QualityChecklist {
  return Object.fromEntries(QUALITY_CHECKLIST_ITEMS.map((item) => [item.key, false]));
}

export function checklistCompletion(checklist: QualityChecklist) {
  const total = QUALITY_CHECKLIST_ITEMS.length;
  const done = QUALITY_CHECKLIST_ITEMS.filter((item) => checklist[item.key]).length;
  return { total, done, percent: Math.round((done / total) * 100) };
}
