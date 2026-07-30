/**
 * Monta o prompt de geração de laboratório guiado. Extraído de `actions.ts` para ser reaproveitado
 * também por scripts standalone (ex.: `scripts/generate-labs-gemini.ts`), que não podem importar
 * `actions.ts` diretamente por causa de `"use server"` + `revalidatePath`.
 */
export function buildLabGenerationMessage(input: {
  scenario: string;
  lessons: { title: string; objective: string | null }[];
}) {
  const lessonList = input.lessons
    .map((l, i) => `${i + 1}. ${l.title}${l.objective ? ` — ${l.objective}` : ""}`)
    .join("\n");

  return [
    `Crie um laboratório prático 100% guiado, passo a passo, para o seguinte cenário: "${input.scenario}".`,
    "",
    "Este laboratório está vinculado ao conteúdo das aulas abaixo — use-as como referência de",
    "quais tecnologias e conceitos o laboratório precisa exercitar na prática (não repita a",
    "teoria da aula, o laboratório é só a prática guiada):",
    lessonList,
    "",
    "REGRAS OBRIGATÓRIAS:",
    "- PROIBIDO usar os projetos internos do curso (ex: 'Labs IA', 'Apex' ou qualquer projeto",
    "  interno do programa) como cenário. Use uma situação real e comum do dia a dia de uma",
    "  empresa em produção — por exemplo: subir uma API interna, configurar um servidor Linux,",
    "  publicar uma aplicação em Kubernetes, montar um pipeline de CI/CD, criar/gerenciar um",
    "  banco de dados, implementar monitoramento e observabilidade, configurar autenticação e",
    "  controle de acesso, integrar serviços entre si, fazer deploy em dev/homologação/produção,",
    "  configurar redes/DNS/proxy/load balancer, backup e alta disponibilidade, automação de",
    "  infraestrutura, ou resolver um incidente real em produção.",
    "- Trate o aluno como uma pessoa completamente leiga em tecnologia: não assuma NENHUM",
    "  conhecimento prévio. Antes de pedir para executar qualquer ação, explique o que ela",
    "  significa e por que está sendo feita. Não pule nenhum passo por mais trivial que pareça",
    "  (inclusive abrir um terminal, instalar uma ferramenta, criar uma pasta, etc).",
    "- Cada passo precisa terminar com o resultado esperado daquele passo específico, para o",
    "  aluno conferir se deu certo antes de seguir para o próximo.",
    "- Seja disciplinado com o orçamento de resposta: não adicione passos extras, seções bônus",
    "  ou digressões (ex: 'como isso seria em outra ferramenta') além do que foi pedido abaixo.",
    "  Se algo relevante merecer uma nota rápida, inclua como uma frase dentro do passo",
    "  relacionado — nunca como um passo ou seção adicional. É mais importante concluir todas as",
    "  seções obrigatórias (principalmente Validação final, Erros comuns e Resumo) do que",
    "  aprofundar demais nos Passos.",
    "",
    "Estruture a resposta em Markdown com exatamente estas 7 seções, nesta ordem. O texto de cada",
    "item abaixo é uma INSTRUÇÃO PARA VOCÊ sobre o que escrever dentro da seção — o título da",
    "seção na sua resposta deve ser SOMENTE o nome curto entre aspas, nada mais (não copie a",
    "instrução para dentro do título):",
    "",
    "1. Título \"Objetivo\": 2-3 frases sobre o que o aluno vai construir/praticar e por que isso",
    "   importa no dia a dia de uma empresa real.",
    "2. Título \"Cenário\": a situação de negócio/produção simulada, com contexto suficiente para o",
    "   laboratório fazer sentido (ex: 'você é o devops recém-contratado de uma empresa X e",
    "   precisa...').",
    "3. Título \"Pré-requisitos\": tudo que precisa estar instalado/configurado/disponível antes",
    "   de começar (ferramentas, contas, acessos, versões mínimas).",
    "4. Título \"Passos\": numerados ('Passo 1', 'Passo 2', ...), cada um com o que fazer e por",
    "   quê, o comando ou ação exata (bloco de código quando for comando ou arquivo de",
    "   configuração), e uma linha 'Resultado esperado:' descrevendo o que o aluno deve ver/",
    "   conferir para saber que aquele passo específico funcionou antes de continuar.",
    "5. Título \"Validação final\": um checklist prático confirmando que o cenário completo está",
    "   funcionando de ponta a ponta.",
    "6. Título \"Erros comuns e troubleshooting\": pelo menos 4 problemas reais que costumam",
    "   acontecer neste tipo de tarefa, a causa provável de cada um, e como resolver.",
    "7. Título \"Resumo e conceitos aplicados\": o que foi aprendido na prática neste laboratório",
    "   e quais conceitos das aulas listadas acima foram exercitados.",
    "",
    "Exemplo de como cada título deve aparecer literalmente na sua resposta (sem a instrução",
    "junto): \"## Objetivo\", \"## Cenário\", \"## Pré-requisitos\", \"## Passos\",",
    "\"## Validação final\", \"## Erros comuns e troubleshooting\", \"## Resumo e conceitos aplicados\".",
  ].join("\n");
}
