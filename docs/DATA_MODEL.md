# Data Model

Modelo relacional (PostgreSQL + Prisma). Todas as entidades têm `id` (cuid), `createdAt`,
`updatedAt`. Conteúdo publicável tem `status` (`DRAFT | PLANNED | AVAILABLE | IN_PROGRESS |
COMPLETED | ARCHIVED`). JSON só é usado quando não há relacionamento razoável (ex.: payload bruto
de resposta de IA, metadados de importação).

## 1. Identidade e acesso

- **User**(id, email, passwordHash, name, role: `STUDENT|ADMIN`, createdAt, ...)
- **Profile**(userId 1:1, avatarUrl, timezone, studyPreferences JSON leve, bio, manualCommitCount)
  — `manualCommitCount` (Etapa 5): campo manual editável pelo próprio estudante no Dashboard,
  já que a integração real com GitHub (`GitHubProvider`) é opcional e nunca chamada — ver
  `docs/DECISIONS.md`.
- **PasswordResetToken**(userId, tokenHash, expiresAt, usedAt)

## 2. Currículo (hierarquia acadêmica)

> **Implementado na Fase 2** (schema real em `prisma/schema.prisma`):
> `Program 1—N Phase 1—N Week 1—N Lesson 1—N Resource`, mais `Week 1—N ChecklistItem
> 1—N ChecklistItemProgress` (por usuário) e `Lesson 1—N LessonCompletion` (por usuário).
> `Track`/`Module` (nível entre Fase e Semana), `Technology`/`Skill`/`LessonSkill` e
> `Activity`/`Checkpoint` — presentes no diagrama abaixo como desenho de longo prazo — **não**
> foram criados ainda; ver `docs/DECISIONS.md` ("Fase 2: schema mínimo por entrega vertical").
> `Quiz`/`Assessment`/`Flashcard` são domínios da Fase 3.

```text
Program 1—N Phase 1—N Track 1—N Module 1—N Week 1—N Lesson 1—N Activity
                                                              1—N Resource
                                                              1—N Quiz (Assessment)
                                                              1—N Flashcard
                                                              1—N Checkpoint
```

- **Program**(slug, name, subtitle, durationMonths, totalWeeks, weeklyDays, dailyHours, status)
- **Phase**(programId, order, name, label /* "Fase N" — o texto de origem em `Curso.md` usa
  "Semestre", mas o app exibe "Fase" */, status, finalProjectId? único, finalAssessmentId?
  único) — os dois campos opcionais (Etapa 8) marcam qual `Project`/`Assessment` conta como
  "final da fase" para a certificação; definidos pela área administrativa em
  `/admin/curriculum`, sparse (só existem quando definidos) — ver `docs/DECISIONS.md`.
- **Track**(phaseId, order, name, status) — trilha dentro da fase (ex.: Backend, Infra) — **ainda não implementado**
- **Module**(trackId, order, name, status) — **ainda não implementado**
- **Week**(programId, phaseId?, number 0–104, title, objective?, isEnvironmentSetup bool,
  isManuallyEdited bool, status) — `phaseId` é opcional só para a Semana 0 (`number = 0`), que
  não pertence a nenhuma fase. `isManuallyEdited` (adicionado nesta sessão, junto com o CRUD
  administrativo — ver `docs/DECISIONS.md`) é marcado `true` por `updateWeekAction` a cada edição
  salva no admin, e faz o importador de `Grade_Curricular.md` pular a semana em vez de
  sobrescrevê-la (ver `docs/CURRICULUM_IMPORT.md`)
- **Lesson**(weekId, order, title, objective, durationMinutes, contentMarkdown, isDemo,
  isManuallyEdited, aiGeneratedAt?, status) — `@@unique([weekId, order])`. Além das 2 aulas de
  demonstração da Semana 0 (Fase 2), cada semana tem `Lesson`(ões) real(is) (`isDemo = false`)
  geradas a partir dos tópicos de `Grade_Curricular.md` — ver `docs/CURRICULUM_IMPORT.md`. A
  unidade de conteúdo é o **dia**, não a semana: módulos já regenerados (ex.: Preparação, semanas
  1–7) têm `Program.weeklyDays` (5) `Lesson`s por semana (`order` 1–5, uma por dia), via
  `importGradeDailyLessons()`; módulos ainda não regenerados mantêm 1 `Lesson`/semana (formato
  legado de `importGradeLessons()`), até serem regenerados no novo formato. `isManuallyEdited`
  (Etapa 3, mesma semântica de `Week.isManuallyEdited`) e `aiGeneratedAt` (marca quando a persona
  Professor reescreveu o conteúdo, sempre com `status = DRAFT` até aprovação administrativa) — ver
  `docs/DECISIONS.md`.
- **Activity**(lessonId, type, title, description, status) — **ainda não implementado**
- **Resource**(lessonId, title, url, kind: `DOC|VIDEO|ARTICLE|REPO|OTHER`)
- **Checkpoint**(weekId, title, criteria) — **ainda não implementado**
- **ChecklistItem** (Semana 0, template importado uma vez)(weekId, category, label, order) —
  `@@unique([weekId, category, label])`
- **ChecklistItemProgress** (estado por usuário)(userId, checklistItemId, done, note,
  evidenceUrl, installedVersion, reviewNeeded, completedAt) — `@@unique([userId, checklistItemId])`.
  Implementado como duas tabelas (template + progresso por usuário) em vez de uma só, já que o
  checklist é compartilhado mas o "marcar como concluído" é individual de cada estudante.

## 3. Tecnologias e competências

> **Implementado na Fase 4** com escopo reduzido: sem `Technology` nem `SkillEvidence` — ver
> `docs/DECISIONS.md`. 14 competências seedadas a partir das áreas de conhecimento citadas em
> `Curso.md`.

- ~~Technology~~ — não implementado; tecnologias aparecem só como texto (ex.: nome da
  competência), sem entidade própria ainda. Não confundir com **`Topic`** (seção 7,
  2026-09-22): entidade diferente, criada especificamente para vínculo de anotações com o nome
  de módulo do Roadmap ("Linux", "Redes"...) — granularidade e propósito diferentes de `Skill`.
- **Skill**(name, category, description?, status) — `name` único
- **LessonSkill**(lessonId, skillId) — N:N, chave primária composta
- **UserSkillProgress**(userId, skillId, level: `NOT_STARTED|INTRO|PRACTICING|COMPETENT|
  ADVANCED`, updatedAt) — nível recalculado automaticamente a cada `LessonCompletion` nova
  (nunca definido manualmente pelo estudante)
- ~~SkillEvidence~~ — não implementado; evidência é calculada por query (join
  `LessonCompletion` × `LessonSkill`), não persistida — ver `docs/DECISIONS.md`.

## 4. Projetos e laboratórios

> **Implementado na Fase 4** com escopo reduzido: sem `ProjectEvidence` genérica (campos de
> evidência ficam direto em `Project`/`Laboratory`) e sem N:N com `Technology` (que não existe).
> 1 projeto e 1 laboratório de demonstração seedados. Ver `docs/DECISIONS.md`.

- **Project**(title, problem?, context?, objective?, requirements[], optionalRequirements[],
  deliverables[], acceptanceCriteria[], architectureNotes?, isDemo, status) — sem `steps` (Json),
  `repoUrl`/`deployUrl`/`decisions`/`retrospective` ficam em `ProjectSubmission` (por usuário,
  não no `Project` template). O "Projeto Final: APEX Academy" (importado de
  `Grade_Curricular.md` — ver `docs/CURRICULUM_IMPORT.md`) é uma linha comum desta mesma tabela,
  não uma entidade separada; `deliverables[]` guarda os 29 componentes do produto SaaS descrito
  no arquivo-fonte. Não confundir com "AI Labs" (seção 9 abaixo), que é a empresa fictícia cuja
  infraestrutura evolui ao longo da formação — são conceitos distintos, ver `docs/DECISIONS.md`.
- **ProjectSubmission**(userId, projectId, repoUrl?, deployUrl?, decisions?, retrospective?,
  status: `OPEN|DONE|CANCELLED`) — `@@unique([userId, projectId])`; é a submissão do estudante,
  separada do template do projeto
- **CodeReview**(submissionId, score? Float, feedback, provider, createdAt) — Etapa 6: revisão
  de código assistida por IA (persona Tech Lead), vinculada a uma `ProjectSubmission`. Histórico
  completo (nunca sobrescrito — cada solicitação cria uma linha nova); `score` é extraído por
  regex da resposta em texto livre da IA (`"Nota: X.X"`), fica `null` se não for possível
  extrair. Ver `docs/DECISIONS.md`.
- **Laboratory**(title, scenario?, objective?, environment?, prerequisites[], instructions?,
  commands?, expectedResult?, validation?, troubleshooting?, isDemo, isManuallyEdited,
  aiGeneratedAt?, status) — vinculado a aulas via `LaboratoryLesson` (N:N, ver abaixo), sempre
  exibido na UI ("Referente à Semana N–M: <aula 1>, <aula 2>, ..."). Labs gerados por IA (persona
  Professor, mesmo padrão `isManuallyEdited`/`aiGeneratedAt`/`DRAFT` da Etapa 3) guardam o passo a
  passo completo em `instructions` (Markdown renderizado, não mais texto puro) — `scenario` é só
  um resumo curto de uma linha para os cards de listagem, a versão completa do cenário fica na
  seção `## Cenário` dentro de `instructions`; os demais campos
  (`environment`/`commands`/`expectedResult`/`validation`/`troubleshooting`) continuam
  disponíveis para labs criados manualmente pelo admin, mas ficam vazios nos gerados por IA
  (tudo já está em `instructions`). Ver `docs/DECISIONS.md`.
- **LaboratoryLesson**(laboratoryId, lessonId, createdAt) — tabela de junção N:N: um mesmo
  laboratório pode abranger o conteúdo de várias aulas (de semanas/módulos diferentes), e uma aula
  pode ter vários laboratórios distintos. Substituiu um `Laboratory.lessonId` (FK única opcional)
  da versão anterior — ver `docs/DECISIONS.md` para o motivo e a migration de dados.
- **LaboratoryCompletion**(userId, laboratoryId, completedAt, evidenceUrl?, notes?) —
  `@@unique([userId, laboratoryId])`
- ~~ProjectEvidence~~ — não implementado (ver acima)

## 5. Planejamento e progresso

> **Implementado na Fase 3.** Sem tabela `Progress` própria — agregados (aulas concluídas,
> minutos estudados, sequência de dias) são calculados sob demanda via `COUNT`/`SUM` no
> dashboard, não persistidos. Ver `docs/DECISIONS.md`.

- **StudyPlan**(userId 1:1, availableDays Int[], preferredTime?, dailyHours, startDate, notes?)
  — `pace` não existe como campo separado; a estimativa de ritmo é calculada na página, não
  armazenada. **2026-07-24**: passou a alimentar um motor de agendamento por aula
  (`computeLessonSchedule`) que distribui as aulas `AVAILABLE` do currículo nos dias
  disponíveis — também sem tabela de agendamento própria, recalculado a cada requisição a partir
  de `LessonCompletion`. Ver `docs/DECISIONS.md`.
- **StudyGoal**(userId, title, targetDate?, relatedWeekId?, status: `OPEN|DONE|CANCELLED`)
- **StudySession**(userId, lessonId?, externalLessonId?, startedAt, pausedAt?,
  totalPausedSeconds, endedAt?, durationMinutes?, focusRating?, difficultyRating?, notes?,
  completedContent) — o cronômetro sobrevive a refresh porque todo o estado
  (`startedAt`/`pausedAt`/`totalPausedSeconds`) vive no banco; o cliente só recalcula
  `elapsed = now - startedAt - totalPausedSeconds`. `externalLessonId` (seção 13, Study Hub) foi
  adicionado à mesma tabela em vez de criar uma tabela paralela — o cronômetro, o modo Pomodoro e
  o cálculo de sequência de dias/horas totais funcionam idênticos para aula nativa ou externa,
  cada `StudySession` referenciando no máximo um dos dois (nunca os dois ao mesmo tempo).
- ~~Progress~~ — não implementado (ver acima).
- **LessonCompletion**(userId, lessonId, completedAt, confidence 1–5, whatLearned?, whatUnclear?)
  — já existia desde a Fase 2; `reviewRequested` não foi adicionado (não há para onde essa
  revisão ir ainda — sem fila de revisão/admin de dúvidas).

## 6. Avaliação e revisão

> **Implementado na Fase 3** com escopo reduzido: só quiz de múltipla escolha é corrigido
> automaticamente; `SELF_ASSESSMENT`/`CHECKPOINT` não existem como tipos de `Assessment` (o
> campo é só `title`/`status`, sem enum de tipo no nível do Assessment — a variação fica no
> `Question.type`). Ver `docs/DECISIONS.md`.

- **Assessment**(lessonId?, title, status) — sem enum de tipo próprio
- **Question**(assessmentId, order, prompt, type: `MULTIPLE_CHOICE|TRUE_FALSE|SHORT_ANSWER`,
  explanation?) — `@@unique([assessmentId, order])`; `SHORT_ANSWER` existe no schema mas não é
  usado na avaliação de demonstração nem entra no cálculo de nota (sem correção automática)
- **AnswerOption**(questionId, order, text, isCorrect) — `@@unique([questionId, order])`
- **AssessmentAttempt**(userId, assessmentId, startedAt, submittedAt?, score?,
  answers Json /* questionId -> optionId */, timeSpentSeconds?)
- **Flashcard**(lessonId?, question, answer, difficulty, tags[]) — sem campo `area`/`moduleId`
  próprio; a referência de contexto é só a aula
- **FlashcardReview**(userId, flashcardId, reviewedAt, quality 0–5, nextReviewAt, intervalDays,
  easeFactor) — SM-2 simplificado em `src/modules/flashcards/sm2.ts`, testado em
  `tests/unit/sm2.test.ts`

## 7. Anotações

> **Implementado na Fase 3, estendido em 2026-09-22.** `scopeType`/`scopeId` continuam sendo o
> vínculo *primário* (mutuamente exclusivo) de uma anotação — `LESSON`, `EXTERNAL_LESSON`
> (aula de curso externo do Study Hub), `WEEK` (semana do Roadmap, ativado em 2026-09-22 — o
> enum já existia desde a Fase 3, mas nenhuma tela oferecia o seletor até agora) ou `GENERAL`
> (anotação solta, tela `/notes`). Sem `status` (anotação não é conteúdo publicável).
>
> **Tema/subtema (`Topic`) é um vínculo adicional, independente do escopo primário** — uma
> anotação pode ter zero, um ou vários temas ao mesmo tempo, combinados com qualquer escopo
> (ex.: vinculada à semana 12 *e* ao tema "Linux"). Ver `docs/DECISIONS.md` (2026-09-22) para por
> que `Topic` foi criado como entidade nova em vez de reaproveitar `Skill` (a única entidade de
> "competência" que já existia): `Skill` usa uma taxonomia de categorias amplas
> ("Infraestrutura", "Backend"...) para o mapa de competências, enquanto os temas visíveis na
> timeline do Roadmap são nomes de módulo granulares ("Linux", "Redes", "Docker") derivados de
> `Week.title` via `extractModuleName()` — as duas taxonomias não coincidem, e forçar o vínculo
> em `Skill` teria misturado dois conceitos de produto diferentes.
>
> **Anexos (`NoteAttachment`)**, também 2026-09-22: uma anotação pode ter múltiplos arquivos
> (imagem jpg/png/webp, PDF, texto/markdown; até 10MB cada). Armazenados via `FileStorageProvider`
> (`src/lib/storage/`) — hoje só `LocalFileStorageProvider` (disco local/volume Docker, fora de
> `public/`), trocável por S3 depois sem mudar a lógica de domínio. Servidos só por
> `GET /api/notes/attachments/[id]`, autenticado e dono-only, nunca por caminho estático.

- **Note**(userId, scopeType: `LESSON|EXTERNAL_LESSON|WEEK|GENERAL`, scopeId?,
  template: `SUMMARY|QUESTION|DECISION|TROUBLESHOOTING|RETROSPECTIVE|CONCEPT|COMMAND`,
  title, contentMarkdown, tags[], isFavorite)
- **Topic**(name único) — derivado e populado automaticamente por `syncTopicsFromWeeks()`
  (roda a cada importação de currículo); nunca editado manualmente, nunca removido mesmo se o
  módulo de origem desaparecer do currículo (para não quebrar vínculos já criados pelo aluno).
- **NoteTopic**(noteId, topicId) — tabela de junção N:N entre `Note` e `Topic`.
- **NoteAttachment**(noteId, originalName, storageKey, mimeType, size, createdAt) — `storageKey`
  é opaco (gerado, nunca derivado do nome enviado), resolvido em bytes só pelo
  `FileStorageProvider`.

## 8. Portfólio e gamificação

> **Implementado na Fase 4.** `GitHubProvider` (`src/modules/portfolio/github-provider.ts`) é
> uma interface + implementação que sempre lança erro — nunca chamada pelo produto. Ver
> `docs/DECISIONS.md`.

- **PortfolioItem**(userId, projectId?, repoUrl, qualityChecklist Json /* 14 chaves booleanas —
  ver `src/modules/portfolio/checklist.ts` */, status, githubSyncedAt?, githubDescription?,
  githubOpenIssues?, githubLatestRelease?) — os 4 últimos campos (migration
  `20260725042615_portfolio_github_sync`) guardam a última sincronização real com a API REST
  pública do GitHub (`RestGitHubProvider`, sem OAuth — só leitura pública, token opcional só para
  levantar o limite de requisições). Sincroniza objetivamente README/licença/CI/release/
  descrição; os outros itens do checklist continuam manuais (exigem julgamento de conteúdo).
  `GitHubProvider` deixou de ser uma interface nunca chamada — ver `docs/DECISIONS.md`.
- **Badge**(code, name, description, icon) — catálogo de 9, seedado por
  `seedBadgeCatalog()`
- **UserBadge**(userId, badgeId, earnedAt) — `@@unique([userId, badgeId])`
- **ExperienceEvent**(userId, kind, points, refType?, refId?, createdAt) — nível = `1 +
  floor(totalXp / 100)`, calculado sob demanda (sem campo `level` persistido em `User`)

## 9. AI Labs (empresa fictícia), Trilha Produto (APEX Academy) e Trilha Profissional

> **Implementado na Fase 4.** Importado de `Curso.md` (âncoras "Teremos departamentos" e "Ela
> começará assim:") — 10 departamentos, 24 marcos. Marcos só viram `COMPLETED` por ação
> explícita de um ADMIN em `/ai-labs`; a importação nunca marca nada como alcançado. Sem campo
> `layer` (não extraível do texto-fonte com segurança).
> **Etapa 4** (pós-Fase 6): `ArchitectureMilestone` passou a servir também a Trilha Produto do
> roadmap (evolução do SaaS "APEX Academy" construído pelo aluno — entidade distinta da AI Labs,
> ver `docs/DECISIONS.md`), via o campo `track`. As duas trilhas nunca se misturam: toda query
> que lê marcos da AI Labs filtra `track = AI_LABS` explicitamente.
> **Expansão de Trilhas** (2026-07-24): terceira trilha, "Trilha Profissional" (habilidades de
> mercado/carreira — comunicação com cliente, documentação, code review, portfólio, entrevista
> técnica, etc), adicionada como `track = PROFESSIONAL` na mesma tabela. Populada com 24 marcos
> de Produto (1 por módulo, na última semana de cada) e 16 marcos Profissionais (espalhados pelas
> 104 semanas, em semanas distintas dos marcos de Produto), com conteúdo real curado — não mais
> "a definir" em todas as semanas. Ver `docs/DECISIONS.md`.

- **Department**(name, description?, order) — `name` único
- **ArchitectureMilestone**(track: `AI_LABS|PRODUCT|PROFESSIONAL`, weekId? único, order, title,
  description?, status, achievedAt?) — `@@unique([track, order])`. `track = AI_LABS` (padrão): as
  24 linhas da AI Labs, sem `weekId`. `track = PRODUCT`/`PROFESSIONAL`: no máximo 1 linha por
  `Week` no total (`weekId` único na tabela inteira — uma semana nunca tem marco de Produto **e**
  Profissional ao mesmo tempo), editável em `/admin/curriculum/[weekId]` via um único formulário
  com seletor de trilha (`saveMilestoneAction`). Semanas sem marco aparecem como "a definir"
  computado na UI, não como linha vazia no banco.

## 10. IA

> **Implementado na Fase 5, expandido em Etapas pós-Fase 6** (multi-provider + personas — ver
> `docs/ARCHITECTURE.md` §6 e `docs/DECISIONS.md`). `context` fica `null` na prática (o contexto
> é montado sob demanda por `buildContextForUser()`, não persistido na conversa); o campo
> continua no schema para permitir persistir contexto estruturado no futuro sem migration.

- **AIConversation**(userId, context Json?, createdAt) — uma conversa "contínua" por usuário
  (todas as interações do tutor acumulam nela)
- **AIMessage**(conversationId, role: `USER|ASSISTANT`, content, provider, tokensApprox?,
  createdAt) — `provider` grava qual provider realmente respondeu: `mock`, `openai`, `claude` ou
  `gemini` (Gateway multi-provider, roteado por tipo de tarefa/persona — ver
  `docs/ARCHITECTURE.md` §6). Não há tabela própria para "qual persona" foi usada em cada
  mensagem — a persona escolhida na aba "Conversar com uma persona" fica só no prompt de sistema
  daquela chamada, não persistida por mensagem.
- **LessonQuestion**(lessonId, userId, question, answer, provider, createdAt) — cada pergunta
  feita no diálogo "Pergunte ao Professor" de uma aula, com a resposta da IA (sempre via um
  Gemini fixo, `getGeminiProvider()` — não passa pelo roteamento por tarefa). Diferente de
  `AIConversation`/`AIMessage` (histórico privado do usuário no `/ai-tutor`), esta tabela é
  exibida publicamente na página da aula para **todos** os alunos, não só quem perguntou — é o
  mecanismo de "outra pessoa com a mesma dúvida já vê a resposta pronta". Ver `docs/DECISIONS.md`.
- **CodeReview** (seção 4) reaproveita o mesmo `provider: string` livre (não uma FK) — sempre a
  persona Tech Lead, roteada para Claude/mock.

## 11. Importação

- **ImportJob**(sourceFile, contentHash, startedAt, finishedAt, createdCount, updatedCount,
  skippedCount, report JSON)
- **ImportWarning**(importJobId, excerpt, reason, targetEntityHint, needsReview bool)

## 12. Certificação (Etapa 8)

> Certificado **interno** da formação — não é uma certificação de mercado. Emitido só quando os
> 3 requisitos da fase são cumpridos (checados sob demanda, sem cache): todas as semanas
> obrigatórias da fase com `Lesson` `AVAILABLE` concluídas (`LessonCompletion`), o projeto
> final da fase (`Phase.finalProject`) com `ProjectSubmission.status = DONE`, e a avaliação
> final da fase (`Phase.finalAssessment`) com ao menos um `AssessmentAttempt` enviado.

- **Certification**(userId, phaseId, code único, issuedAt) — `@@unique([userId, phaseId])`,
  emitido uma única vez por usuário/fase; `code` gerado como `APEX-S{order}-{uuid curto}`
  (prefixo trocado de `APEA` para `APEX` no rebranding, `src/modules/certifications/actions.ts`;
  `S` mantido por estabilidade do formato — não está ligado ao rótulo "Fase" exibido na UI).

## 13. Study Hub (cursos externos)

> **Não documentado em versões anteriores deste arquivo** — adicionado nesta auditoria
> (2026-09-11) para refletir o código real. Módulo independente do currículo nativo (seção 2);
> ver `docs/ARCHITECTURE.md` §9 para as 3 formas de importar um curso.

- **ExternalCourse**(userId, title, description?, platform?, instructor?, url?, imageUrl?,
  category?, startDate?, targetDate?, status: `NOT_STARTED|IN_PROGRESS|PAUSED|COMPLETED`)
- **ExternalModule**(courseId, parentModuleId? — auto-referenciada via relação nomeada
  `ModuleChildren`, title, order) — módulos podem se aninhar em qualquer profundidade, para
  espelhar a hierarquia real de pastas de um curso importado; `courseId` fica presente em todo
  módulo (raiz ou aninhado), então contagens/queries não precisam atravessar a árvore inteira. A
  árvore completa é remontada em memória a partir de listas achatadas (Prisma não suporta
  `include` recursivo de profundidade arbitrária) — ver `buildModuleTree` em
  `src/modules/study-hub/queries.ts`.
- **ExternalLesson**(moduleId, title, order, completed, completedAt?, markedForReview,
  lastAccessedAt?) — `@@unique([moduleId, order])`. `markedForReview` alimenta a mesma fila de
  revisão do currículo nativo (função `getReviewItems`, ao lado de `LessonReviewMark` abaixo);
  `lastAccessedAt` decide "continuar estudando" no Study Hub, junto com `StudySession`/
  `LessonCompletion` para o currículo nativo (`getContinueStudying`).
- **LessonReviewMark**(userId, lessonId) — `@@unique([userId, lessonId])`. Equivalente, para
  aulas do currículo **nativo**, ao campo `ExternalLesson.markedForReview` — implementado como
  tabela separada em vez de um campo em `Lesson` porque a marcação é por usuário (a mesma aula
  pode estar marcada para revisão por um estudante e não por outro), diferente de
  `ExternalLesson`, que já é 1:1 de um usuário (todo curso externo pertence a um usuário só).
- **ActivityLogEntry**(userId, type: `LESSON_COMPLETED|LESSON_REOPENED|SESSION_FINISHED|
  LESSON_MARKED_REVIEW|LESSON_UNMARKED_REVIEW|COURSE_STARTED|COURSE_COMPLETED`, title, href?,
  metadata Json?) — histórico de atividade do Study Hub (`/study-hub/historico`); `title`/`href`
  ficam denormalizados na própria linha (em vez de FK polimórfica para `Lesson`/`ExternalLesson`/
  `ExternalCourse`) porque o registro deve continuar legível mesmo que a aula/curso referenciado
  seja depois excluído.
- Estatísticas (`/study-hub/estatisticas`) e fila de revisão são **calculadas sob demanda** a
  partir de `StudySession`/`LessonCompletion`/`ExternalLesson`/`ExternalCourse` já existentes —
  sem tabela agregada própria, mesmo padrão já usado no dashboard principal (seção 5).
- **Não integrado**: gamificação (XP/badges, seção 8) considera só `LessonCompletion`/
  `LaboratoryCompletion`/`ProjectSubmission`/`AssessmentAttempt`/`ChecklistItemProgress` —
  nenhum evento do Study Hub concede XP ou badge hoje. Ver `docs/DECISIONS.md` e a seção de
  sugestões do README.

## Índices e constraints (mínimo)

- `User.email` único.
- `Week.number` único por `Program` (`@@unique([programId, number])`).
- `LessonCompletion` único por `(userId, lessonId)`.
- `ChecklistItemProgress` único por `(userId, checklistItemId)`.
- `UserSkillProgress` único por `(userId, skillId)` — **ainda não implementado** (Fase 4).
- `FlashcardReview` indexado por `(userId, nextReviewAt)` (fila de revisão) — implementado.
- `ExternalModule` indexado por `(courseId, parentModuleId)`; `ExternalLesson` único por
  `(moduleId, order)`; `LessonReviewMark` único por `(userId, lessonId)`; `ActivityLogEntry`
  indexado por `(userId, createdAt)`.
- `Note` indexado por `userId`; busca por texto via `contains`/`insensitive` do Prisma (≈ `ILIKE`),
  não `tsvector` — ver `docs/DECISIONS.md` ("Busca de anotações").
- Exclusão: soft delete (`archivedAt`/`status = ARCHIVED`) para conteúdo acadêmico e projetos;
  hard delete permitido para dados transacionais do próprio usuário (ex.: sessão descartada,
  anotação, meta — todos implementados como hard delete real).

O schema Prisma completo vive em `prisma/schema.prisma` e é a fonte de verdade final; este
documento descreve a intenção e pode ficar um passo atrás do schema durante a implementação.
