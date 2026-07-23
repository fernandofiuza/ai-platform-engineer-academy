// Extrai os componentes de arquitetura da resposta em texto livre da persona Arquiteto (Etapa
// 2/7). O prompt pede explicitamente o formato "- **Nome**: justificativa" para tornar a
// extração confiável sem precisar de um método novo em `AIProvider` (mesma filosofia da Etapa 6
// para a nota do Tech Lead: instrução de formato no prompt + parsing simples, não um esquema
// forçado na IA). Se a resposta não seguir o formato, `components` fica vazio e a UI mostra o
// texto bruto como fallback — nunca falha silenciosamente.

export type ArchitectureComponent = {
  name: string;
  justification: string;
};

const COMPONENT_LINE_REGEX = /^-\s*\*\*(.+?)\*\*:\s*(.+)$/gm;

export function parseArchitectureComponents(text: string): ArchitectureComponent[] {
  const components: ArchitectureComponent[] = [];
  for (const match of text.matchAll(COMPONENT_LINE_REGEX)) {
    components.push({ name: match[1].trim(), justification: match[2].trim() });
  }
  return components;
}
