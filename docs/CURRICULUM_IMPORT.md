# Curriculum Import

> Existem **dois** importadores independentes, para dois arquivos-fonte diferentes: `Curso.md`
> (Fase 2, seção abaixo) e `Grade_Curricular.md` (grade real e detalhada, seção
> "Curriculum Import — `Grade_Curricular.md`" ao final deste documento, adicionada nesta sessão).
> Eles não compartilham parser (os formatos são diferentes), mas seguem o mesmo padrão de
> idempotência via `ImportJob.contentHash`.

## Curso.md

> Atualizado na Fase 2 para refletir a implementação real
> (`src/modules/curriculum-import/{parser,service}.ts`). A versão original deste documento
> (Etapa 1) especulava uma estratégia de parsing genérica por "blocos de conversa"; na prática,
> como `Curso.md` não tem headings Markdown reais (é uma transcrição de chat colada), o parser
> usa âncoras de texto literal + regex direcionados, não um parser genérico de Markdown. Ver
> `docs/DECISIONS.md` para o porquê dessa escolha e para o bug de CRLF encontrado e corrigido.

## Objetivo

Importar `Curso.md` para o banco como conteúdo estrutural rastreável, preservando o texto
original e sinalizando ambiguidade em vez de inventar estrutura.

## O que é extraído hoje (Fase 2)

- **Program**: nome, subtítulo, duração (24 meses / 104 semanas), carga (5d/sem, 3h30/dia).
  Extraído por âncora literal (`raw.includes("24 meses")` etc.) — se a âncora não for encontrada
  (ex.: o texto for editado), gera `ImportWarning` e mantém o último valor conhecido.
- **6 Semestres (`Phase`)**: extraídos via regex `/(\d)º Semestre\s*\n\s*([^\n]+)/g`, na ordem em
  que aparecem no arquivo.
- **Semana 0 — Preparação do Ambiente**: bloco delimitado pelas âncoras
  `"Instalaremos e configuraremos:"` … `"\nDepois\n"`. Dentro dele, um allowlist de 12 categorias
  conhecidas (Sistema, IDE, IA, Versionamento, Terminal, Docker, Navegadores, Banco, API,
  Desenvolvimento, Diagramas, Documentação) decide onde cada `ChecklistItem` começa; linhas com
  prefixo "✅ " têm o prefixo removido. Resultado: 40 itens.
- **Semanas 1–104**: criadas vazias (`status = PLANNED`, título `"Semana N — a definir"`),
  distribuídas nos 6 semestres em faixas contíguas o mais uniformes possível (ver
  `docs/DECISIONS.md`).
- **Departamentos da AI Labs** (Fase 4): bloco delimitado pelas âncoras
  `"Teremos departamentos"` … `"Cada módulo contribuirá para um departamento."`. Linhas
  prefixadas com "📁 " viram `Department`, na ordem em que aparecem. Resultado: 10 departamentos.
- **Linha do tempo de arquitetura da AI Labs** (Fase 4): bloco delimitado pelas âncoras
  `"Ela começará assim:"` … `"Você verá a arquitetura crescer passo a passo."`. Linhas iguais a
  `"↓"` são separadores (ignoradas); a frase de transição `"Depois de dois anos estará assim:"`
  também é ignorada; as demais linhas viram `ArchitectureMilestone`, na ordem em que aparecem.
  Resultado: 24 marcos (`GitHub` → … → `CI/CD`). Todos entram como `status = PLANNED` — a
  importação nunca marca um marco como alcançado; isso é uma ação explícita de um ADMIN em
  `/ai-labs`.

## O que ainda NÃO é extraído (fica para fases futuras)

- Áreas de conhecimento / tecnologias citadas como entidade `Technology` própria (a Fase 4 criou
  `Skill`, mas não `Technology` — ver `docs/DECISIONS.md`).
- Conteúdo semana a semana (1–104), módulos/trilhas dentro de cada semestre, projetos/
  laboratórios específicos com requisitos detalhados, competências com critérios de nível
  oficiais, certificações internas, bibliografia oficial — nada disso está em `Curso.md` de
  forma extraível; continuam como estrutura vazia/planejada (ou com só 1 item demonstrativo,
  no caso de projetos/laboratórios) até serem definidos manualmente pela área administrativa
  (Fase 6).

## Avisos (`ImportWarning`)

Gerados quando:
1. uma âncora literal esperada do `Program` não é encontrada;
2. o número de semestres encontrados é diferente de 6;
3. o bloco da Semana 0 não é encontrado;
4. há linhas dentro do bloco da Semana 0 antes de qualquer categoria conhecida;
5. uma das 12 categorias esperadas não aparece no bloco;
6. o bloco de departamentos não é encontrado, tem linha(s) sem o prefixo "📁 ", ou falta algum
   dos 10 departamentos esperados;
7. o bloco da linha do tempo de arquitetura não é encontrado ou não rende nenhum marco.

Na execução atual contra `Curso.md`, **zero avisos** são gerados (todas as âncoras batem).

## Idempotência

- Uma `ImportJob` é criada a cada execução, com hash SHA-256 do conteúdo do arquivo
  (`ImportJob.contentHash`). Se o hash não mudou desde a última importação bem-sucedida
  (mesmo `sourceFile` + mesmo hash), o comando informa que não há novidade e não toca no banco.
- `Program`/`Phase`/`Week` (0) upsert por chave natural (`slug`; `programId+order`;
  `programId+number`). `ChecklistItem` upsert por `(weekId, category, label)`. `Week` 1–104: só
  criadas se ainda não existirem (nunca atualizadas pela importação, já que não têm conteúdo
  vindo do arquivo para atualizar).
- **Ainda não implementado**: a proteção `isManuallyEdited` descrita originalmente (impedir que a
  reimportação sobrescreva uma edição manual). Não há caminho de código que edite essas entidades
  manualmente antes da Fase 6 (CRUD administrativo), então não há nada para proteger ainda — ver
  `docs/DECISIONS.md`.

## Relatório de importação

Persistido em `ImportJob` (`createdCount`, `updatedCount`, `skippedCount`, `report` JSON) e nas
linhas de `ImportWarning`. Visível em `/admin/imports` (contadores + lista de avisos) e no
console ao rodar o comando.

## Comando

```bash
npm run curriculum:import        # importa (ou confirma que não há mudanças)
npm run curriculum:import -- --force   # força reimportação mesmo com hash igual
```

`prisma/seed.ts` chama a mesma função `importCurriculum()` (não há duas fontes de verdade de
parsing) e, em seguida, cria 2 aulas de demonstração na Semana 0 com conteúdo derivado de
`Curso.md` (nome/subtítulo/duração do programa e o princípio pedagógico "nunca estudar uma
tecnologia sem aplicá-la"), além de competências, 1 projeto, 1 laboratório e o catálogo de
badges (ver `docs/DECISIONS.md`, seção Fase 4).

## Curriculum Import — `Grade_Curricular.md`

> Adicionado nesta sessão (pós-Fase 6), a pedido do usuário. `Curso.md` (seção acima) descreve a
> formação em prosa genérica; `Grade_Curricular.md` é a grade curricular real, criada pelo
> usuário, com os módulos efetivos da formação. Este importador **não substitui** o de
> `Curso.md` — ambos coexistem, com fontes, parsers e comandos próprios. Ver `docs/DECISIONS.md`
> ("Importação de `Grade_Curricular.md`") para o contexto completo da decisão.

### Formato do arquivo-fonte

`Grade_Curricular.md` tem uma estrutura semi-regular, diferente de `Curso.md`:
- Cada módulo começa com uma linha `🟦/🟩/🟨/🟥/🟪 MÓDULO N — Nome` ou `🟦/🟩/🟨/🟥/🟪 Nome`
  (trilhas sem número, ex.: `🟩 IA`, `🟪 Engenharia de Soluções`).
- Seguem linhas de disciplina/tópico (uma tecnologia ou conceito por linha) e, opcionalmente,
  uma linha `Projeto` seguida da descrição do projeto do módulo.
- O bloco `🏆 PROJETO FINAL` encerra o arquivo e descreve o projeto de encerramento da formação
  ("APEX Academy"): uma frase com `"chamada <Título>."` e uma lista de componentes após a linha
  `"Ela será composta por:"`.

### O que é extraído

- **`ParsedModule[]`** (`grade-parser.ts`, `parseModules()`): nome do módulo, peso (ver
  heurística abaixo) e descrição do projeto (se houver), na ordem em que aparecem, até o
  cabeçalho `🏆 PROJETO FINAL`.
- **`ParsedFinalProject`** (`parseFinalProject()`): título, descrição e a lista de componentes do
  bloco `🏆 PROJETO FINAL`.
- **Peso do módulo** (`countTopicWeight()`): conta linhas que não terminam em "." e não são
  rótulos conhecidos (`Disciplinas`/`Objetivo`/`Projeto`) como "tópicos"; aplica um piso mínimo
  de 4 para módulos com descrição muito resumida (n8n, OpenClaw, SaaS caem nesse piso — são
  estimativas, não contagens literais). Ver `docs/DECISIONS.md`.

### Distribuição das semanas

`grade-distribution.ts` (`distributeWeeksAcrossModules()`) distribui as **104 semanas já
existentes** proporcionalmente ao peso de cada módulo, usando o método dos maiores restos
(Hamilton): cada módulo recebe `floor(peso/pesoTotal * 104)` semanas, e as semanas restantes (por
arredondamento) vão para os módulos com maior parte fracionária descartada, garantindo que a
soma feche exatamente em 104. Módulos maiores (mais tópicos, ex.: Fundamentos da Computação,
AWS) recebem mais semanas; módulos no piso mínimo recebem o mínimo (2, na distribuição atual).

### Aplicação no banco (`importModuleGrid()`, `service.ts`)

Para cada faixa de semanas do módulo:
- Se a `Week` tem `isManuallyEdited = true` → **pulada** (não sobrescrita), contada como
  "preservada" no relatório.
- Caso contrário → atualiza apenas `title` (`"Semana N — <Nome do Módulo>"`) e `objective`
  (`"Projeto do módulo: <descrição>"`, se houver descrição de projeto). `status` e `phaseId`
  (vínculo com o semestre) **não são tocados**.

Para o Projeto Final: busca um `Project` existente por título
(`"Projeto Final: <Título>"`); se não existir, cria um com os componentes extraídos como
`deliverables[]` e `status = PLANNED`. Isso **não** cria uma entidade nova no schema — reaproveita
o modelo `Project` já existente desde a Fase 4 (ver `docs/DECISIONS.md`, "AI Labs vs. APEX
Academy").

### Idempotência

Mesmo padrão do importador de `Curso.md`: uma `ImportJob` por execução, com
`contentHash` (SHA-256 do conteúdo de `Grade_Curricular.md`). Reimportação com o mesmo hash não
toca no banco, a menos que `--force` seja usado.

### Comandos

```bash
npm run curriculum:preview-grade   # dry-run: mostra a distribuição calculada, sem gravar nada
npm run curriculum:import-grade    # aplica de verdade (título/objetivo das semanas + Projeto Final)
npm run curriculum:import-grade -- --force   # força reimportação mesmo com hash igual
```

`curriculum:preview-grade` (`scripts/preview-grade-import.ts`) é somente leitura (parseia,
calcula a distribuição e cruza com o estado atual do banco para sinalizar semanas
`isManuallyEdited`), pensado para revisão humana antes de rodar a importação real — foi assim
que a distribuição de 24 módulos/104 semanas foi validada com o usuário antes de aplicar.

### Estado após a última execução real

24 módulos reconhecidos (peso total 229), 104 semanas atualizadas com `status = AVAILABLE` (não
apenas `title`/`objective` — ver `docs/DECISIONS.md` para o bug do `status` esquecido na primeira
versão), 0 preservadas (nenhuma edição manual existia no momento da importação), Projeto Final
"APEX Academy" criado com 29 componentes como `deliverables`. Zero avisos.

### Geração de aulas (`importGradeLessons()`)

`importModuleGrid()` só popula `Week` (título/objetivo/status) — não cria nenhuma `Lesson`. Para
o Dashboard e `/learn` mostrarem conteúdo real de cada módulo (e não só as 2 aulas de
demonstração da Semana 0), existe uma segunda função, `importGradeLessons()`
(`grade-lessons.ts` + `service.ts`), que gera **1 `Lesson` por semana** (104 no total):

- Os tópicos de cada módulo (a mesma lista usada para calcular o peso em `grade-parser.ts`,
  agora exposta em `ParsedModule.topics`) são divididos em fatias contíguas entre as semanas do
  módulo, preservando a ordem do arquivo-fonte (`grade-lessons.ts`, `chunkTopics()`).
- Cada `Lesson` tem `contentMarkdown` estruturado com as seções: objetivo da semana (tópicos
  reais), como estudar, laboratório guiado, exercícios/desafio extra, "como a AI Labs faria" e
  checklist — inspirado na lista "Cada dia de estudo terá" do próprio `Grade_Curricular.md`. A
  última semana de cada módulo também recebe a seção "Projeto do módulo" com a descrição extraída
  do arquivo.
- Módulos sem nenhuma linha de tópico real no texto-fonte (n8n, SaaS — só frases de prosa
  terminadas em ".") usam o nome do módulo como o próprio conteúdo de estudo da semana, para o
  checklist nunca ficar vazio.
- `durationMinutes` de cada aula = `program.weeklyDays * program.dailyHours * 60` (a carga
  semanal do programa, não um valor arbitrário).
- Idempotência: mesmo padrão de `ImportJob.contentHash`, mas com `sourceFile` distinto
  (`"Grade_Curricular.md#lessons"`) do usado por `importModuleGrid`, para os relatórios não se
  confundirem. Dentro de uma execução forçada, qualquer semana que já tenha uma aula não-demo é
  pulada (nunca duplicada nem sobrescrita).

```bash
npm run curriculum:import-lessons              # gera as aulas que ainda não existem
npm run curriculum:import-lessons -- --force   # força reexecução mesmo com hash igual
```

**Última execução real**: 104 aulas criadas (1 por semana), 0 puladas. Conteúdo é intencionalmente
completo em estrutura (todas as seções pedagógicas presentes, tópicos reais de cada semana,
projeto do módulo na última semana) mas não é uma explicação didática aprofundada de cada
tecnologia individual — isso é adicionado incrementalmente pela área administrativa
(`/admin/curriculum`), módulo a módulo, conforme a formação avança (ver seção abaixo, que
substituiu esse formato por 1 aula/semana pelo formato por dia nos módulos já trabalhados).

### Unidade de conteúdo por dia (`importGradeDailyLessons`)

> A pedido explícito do usuário, a unidade real de conteúdo passou a ser o **dia**, não a semana
> — mais alinhado à carga real da formação (`Program.weeklyDays`, 5 dias/semana). Isso não exigiu
> nenhuma migração de schema: `Lesson.order` já suportava múltiplas aulas por semana desde a
> Fase 2 (`@@unique([weekId, order])`); só passou a ser usado com mais de 1 valor por semana.

- `buildDailyLessons(range, weeklyDays)` (`grade-lessons.ts`) reaplica `chunkTopics()` duas
  vezes: uma para dividir os tópicos do módulo entre as semanas da faixa (como
  `buildWeekLessons`), outra para dividir os tópicos de cada semana entre os dias. Dias sem
  tópico novo (semanas com poucos tópicos reais, ex.: 2 para preencher 5 dias) caem em um dia de
  "consolidação" — usando primeiro os tópicos da **própria semana** como referência de revisão,
  só recorrendo aos tópicos do módulo inteiro se a semana não tiver nenhum tópico real.
- `importGradeDailyLessons({ rawContent, weekNumbers })` (`service.ts`): diferente de
  `importGradeLessons` (que só cria quando a semana ainda não tem aula), esta função
  **substitui** — apaga (`deleteMany`) e recria as aulas de cada semana informada em
  `weekNumbers`, pulando (preservando integralmente) qualquer semana com alguma aula
  `isManuallyEdited`. Não é uma migração automática das 104 semanas: é invocada explicitamente
  por lista de números de semana, módulo por módulo, conforme cada um é trabalhado.
- `durationMinutes` de cada aula passou a ser `dailyHours * 60` (~210 min, a carga de 1 dia) em
  vez de `weeklyDays * dailyHours * 60` (a carga da semana inteira).
- Depois da geração template, cada uma das novas aulas diárias passa pelo mesmo fluxo de
  aprofundamento por IA da Etapa 3 (`generateLessonContentAction`, persona Professor) — só que
  agora aplicado a 5 aulas por semana em vez de 1.
- Nenhuma mudança de UI foi necessária: `/roadmap/[weekId]`, `/learn` e
  `/admin/curriculum/[weekId]` já iteravam `week.lessons` como lista desde que o modelo existe.

**Módulos já migrados**: Preparação (semanas 1–7, 35 aulas), Fundamentos da Computação
(semanas 8–19, 60 aulas) e Linux (semanas 20–25, 30 aulas) — 125 aulas diárias geradas,
aprofundadas e aprovadas. As demais 79 semanas continuam no formato legado (1 aula/semana) até
serem trabalhadas.
