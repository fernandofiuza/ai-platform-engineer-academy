import { stripWeekDayPrefix } from "@/modules/planning/format";

/**
 * Monta o prompt de geração de conteúdo de aula. Extraído de `actions.ts` para ser reaproveitado
 * também por scripts standalone (ex.: `scripts/generate-lessons-gemini.ts`), que não podem
 * importar `actions.ts` diretamente por causa de `"use server"` + `revalidatePath`.
 */
export function buildLessonGenerationMessage(lesson: { title: string; objective: string | null }) {
  const theme = stripWeekDayPrefix(lesson.title);
  return [
    `Gere o conteúdo completo desta aula em Markdown, para o tema: "${theme}"`,
    `Não inclua "Semana" ou "Dia" no título/heading da aula — comece direto pelo tema.`,
    `(objetivo: ${lesson.objective ?? "não informado"}).`,
    "Use o conteúdo de referência (tópicos e checklist já definidos para esta semana) apenas para",
    "saber QUAIS tópicos cobrir e qual é o projeto do módulo — não copie o texto dele, ele é só um",
    "esqueleto raso. Você deve ENSINAR CADA TÓPICO de verdade, como um professor especialista",
    "faria em uma aula real. Não invente tecnologias que não estejam no conteúdo de referência.",
    "PROIBIDO: respostas que só instruem o estudante a \"pesquisar a documentação oficial\",",
    "\"testar por conta própria\" ou equivalentes, sem antes ensinar o conteúdo você mesmo — isso",
    "é uma falha grave, não uma aula.",
    "A aula final deve ter, nesta ordem, em seções Markdown separadas: (1) objetivo da aula; (2)",
    "explicação completa e tecnicamente precisa de cada conceito/tópico, escrita por você, não",
    "delegada a uma fonte externa; (3) pelo menos uma analogia concreta do dia a dia por conceito",
    "difícil; (4) uma seção aplicando o princípio 80/20, destacando explicitamente os 20% do",
    "conteúdo que trazem 80% do entendimento prático; (5) exemplos reais e concretos — trechos de",
    "código, comandos de terminal, configurações, conforme o tema, nunca substituídos por",
    "instruções genéricas; (6) só então um checklist de laboratório guiado; (7) exercícios.",
  ].join(" ");
}
