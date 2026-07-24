/**
 * Extrai o nome da matéria/módulo do título da semana (ex.: "Semana 61 — Docker" -> "Docker").
 * Semanas ainda sem conteúdo real definido ficam com o título inteiro como fallback (nunca
 * quebra a exibição mesmo para semanas não migradas ainda). Usado onde quer que a UI precise
 * mostrar "a matéria" em vez do número da semana — Roadmap (`RoadmapPath`) e Laboratórios.
 */
export function extractModuleName(weekTitle: string): string {
  const match = weekTitle.match(/—\s*(.+)$/);
  return match ? match[1].trim() : weekTitle.trim();
}
