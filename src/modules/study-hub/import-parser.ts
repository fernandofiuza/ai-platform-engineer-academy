export type ParsedImportModule = {
  title: string;
  lessons: { title: string }[];
};

export type ParsedImport = {
  title: string;
  modules: ParsedImportModule[];
};

type ParseResult = { data: ParsedImport | null; error: string | null };

function isKeyword(line: string, keyword: string) {
  return line.trim().toUpperCase() === keyword;
}

/**
 * Gramática fixa (Fase 1, decidida com o usuário): CURSO:/PASTA:/AULAS:, cada marcador seguido
 * de uma linha (curso/módulo) ou várias linhas (aulas, uma por linha) até a próxima linha em
 * branco ou o próximo marcador. Não é heurístico — se o texto não seguir esse formato, erra de
 * forma explícita em vez de tentar adivinhar.
 */
export function parseCourseText(rawText: string): ParseResult {
  const lines = rawText.replace(/\r\n/g, "\n").split("\n");

  let title: string | null = null;
  const modules: ParsedImportModule[] = [];
  let currentModule: ParsedImportModule | null = null;
  let mode: "none" | "expect-course" | "expect-module" | "lessons" = "none";

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (isKeyword(line, "CURSO:")) {
      mode = "expect-course";
      continue;
    }
    if (isKeyword(line, "PASTA:")) {
      mode = "expect-module";
      continue;
    }
    if (isKeyword(line, "AULAS:")) {
      mode = "lessons";
      continue;
    }

    if (!line) {
      if (mode === "lessons") mode = "none";
      continue;
    }

    if (mode === "expect-course") {
      title = line;
      mode = "none";
      continue;
    }

    if (mode === "expect-module") {
      currentModule = { title: line, lessons: [] };
      modules.push(currentModule);
      mode = "none";
      continue;
    }

    if (mode === "lessons") {
      if (!currentModule) {
        return {
          data: null,
          error: `Encontrei uma aula ("${line}") antes de qualquer "PASTA:". Todo bloco de "AULAS:" precisa vir depois de uma "PASTA:".`,
        };
      }
      currentModule.lessons.push({ title: line });
      continue;
    }
  }

  if (!title) {
    return { data: null, error: 'Não encontrei "CURSO:" seguido do nome do curso.' };
  }
  if (modules.length === 0) {
    return { data: null, error: 'Não encontrei nenhuma "PASTA:" (módulo).' };
  }
  const emptyModule = modules.find((m) => m.lessons.length === 0);
  if (emptyModule) {
    return {
      data: null,
      error: `O módulo "${emptyModule.title}" não tem nenhuma aula em "AULAS:".`,
    };
  }

  return { data: { title, modules }, error: null };
}
