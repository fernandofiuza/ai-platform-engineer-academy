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
- **Phase**(programId, order, name, label /* "Semestre N" */, status, finalProjectId? único,
  finalAssessmentId? único) — os dois campos opcionais (Etapa 8) marcam qual `Project`/
  `Assessment` conta como "final do semestre" para a certificação; definidos pela área
  administrativa em `/admin/curriculum`, sparse (só existem quando definidos) — ver
  `docs/DECISIONS.md`.
- **Track**(phaseId, order, name, status) — trilha dentro do semestre (ex.: Backend, Infra) — **ainda não implementado**
- **Module**(trackId, order, name, status) — **ainda não implementado**
- **Week**(programId, phaseId?, number 0–104, title, objective?, isEnvironmentSetup bool,
  isManuallyEdited bool, status) — `phaseId` é opcional só para a Semana 0 (`number = 0`), que
  não pertence a nenhum semestre. `isManuallyEdited` (adicionado nesta sessão, junto com o CRUD
  administrativo — ver `docs/DECISIONS.md`) é marcado `true` por `updateWeekAction` a cada edição
  salva no admin, e faz o importador de `Grade_Curricular.md` pular a semana em vez de
  sobrescrevê-la (ver `docs/CURRICULUM_IMPORT.md`)
- **Lesson**(weekId, order, title, objective, durationMinutes, contentMarkdown, isDemo,
  isManuallyEdited, aiGeneratedAt?, status) — `@@unique([weekId, order])`. Além das 2 aulas de
  demonstração da Semana 0 (Fase 2), as 104 semanas 1–104 têm cada uma 1 `Lesson` real
  (`isDemo = false`) gerada por `importGradeLessons()` a partir dos tópicos de
  `Grade_Curricular.md` — ver `docs/CURRICULUM_IMPORT.md`. `isManuallyEdited` (Etapa 3, mesma
  semântica de `Week.isManuallyEdited`) e `aiGeneratedAt` (marca quando a persona Professor
  reescreveu o conteúdo, sempre com `status = DRAFT` até aprovação administrativa) — ver
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
  competência), sem entidade própria ainda.
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
- **Laboratory**(title, objective?, environment?, prerequisites[], instructions?, commands?,
  expectedResult?, validation?, troubleshooting?, isDemo, status)
- **LaboratoryCompletion**(userId, laboratoryId, completedAt, evidenceUrl?, notes?) —
  `@@unique([userId, laboratoryId])`
- ~~ProjectEvidence~~ — não implementado (ver acima)

## 5. Planejamento e progresso

> **Implementado na Fase 3.** Sem tabela `Progress` própria — agregados (aulas concluídas,
> minutos estudados, sequência de dias) são calculados sob demanda via `COUNT`/`SUM` no
> dashboard, não persistidos. Ver `docs/DECISIONS.md`.

- **StudyPlan**(userId 1:1, availableDays Int[], preferredTime?, dailyHours, startDate, notes?)
  — `pace` não existe como campo separado; a estimativa de ritmo é calculada na página, não
  armazenada.
- **StudyGoal**(userId, title, targetDate?, relatedWeekId?, status: `OPEN|DONE|CANCELLED`)
- **StudySession**(userId, lessonId?, startedAt, pausedAt?, totalPausedSeconds, endedAt?,
  durationMinutes?, focusRating?, difficultyRating?, notes?, completedContent) — o cronômetro
  sobrevive a refresh porque todo o estado (`startedAt`/`pausedAt`/`totalPausedSeconds`) vive no
  banco; o cliente só recalcula `elapsed = now - startedAt - totalPausedSeconds`.
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

> **Implementado na Fase 3** com escopo reduzido: a UI só oferece vínculo com **aula**
> (`LESSON`); `WEEK`/`MODULE`/`PROJECT`/`LAB`/`TECHNOLOGY`/`SKILL` existem no enum `NoteScope`
> mas sem seletor correspondente ainda (`Project`/`Technology`/`Skill` nem existem como
> entidades). Sem `status` (anotação não é conteúdo publicável). Ver `docs/DECISIONS.md`.

- **Note**(userId, scopeType: `LESSON|WEEK|GENERAL`, scopeId?,
  template: `SUMMARY|QUESTION|DECISION|TROUBLESHOOTING|RETROSPECTIVE|CONCEPT|COMMAND`,
  title, contentMarkdown, tags[], isFavorite)

## 8. Portfólio e gamificação

> **Implementado na Fase 4.** `GitHubProvider` (`src/modules/portfolio/github-provider.ts`) é
> uma interface + implementação que sempre lança erro — nunca chamada pelo produto. Ver
> `docs/DECISIONS.md`.

- **PortfolioItem**(userId, projectId?, repoUrl, qualityChecklist Json /* 14 chaves booleanas —
  ver `src/modules/portfolio/checklist.ts` */, status)
- **Badge**(code, name, description, icon) — catálogo de 9, seedado por
  `seedBadgeCatalog()`
- **UserBadge**(userId, badgeId, earnedAt) — `@@unique([userId, badgeId])`
- **ExperienceEvent**(userId, kind, points, refType?, refId?, createdAt) — nível = `1 +
  floor(totalXp / 100)`, calculado sob demanda (sem campo `level` persistido em `User`)

## 9. AI Labs (empresa fictícia) e Trilha Produto (APEX Academy)

> **Implementado na Fase 4.** Importado de `Curso.md` (âncoras "Teremos departamentos" e "Ela
> começará assim:") — 10 departamentos, 24 marcos. Marcos só viram `COMPLETED` por ação
> explícita de um ADMIN em `/ai-labs`; a importação nunca marca nada como alcançado. Sem campo
> `layer` (não extraível do texto-fonte com segurança).
> **Etapa 4** (pós-Fase 6): `ArchitectureMilestone` passou a servir também a Trilha Produto do
> roadmap (evolução do SaaS "APEX Academy" construído pelo aluno — entidade distinta da AI Labs,
> ver `docs/DECISIONS.md`), via o campo `track`. As duas trilhas nunca se misturam: toda query
> que lê marcos da AI Labs filtra `track = AI_LABS` explicitamente.

- **Department**(name, description?, order) — `name` único
- **ArchitectureMilestone**(track: `AI_LABS|PRODUCT`, weekId? único, order, title, description?,
  status, achievedAt?) — `@@unique([track, order])`. `track = AI_LABS` (padrão): as 24 linhas da
  AI Labs, sem `weekId`. `track = PRODUCT` (Etapa 4): no máximo 1 linha por `Week` (`weekId`
  único), criada sob demanda pelo admin em `/admin/curriculum/[weekId]` — **não** pré-criada em
  massa para as 104 semanas (não há conteúdo real de origem para isso; semanas sem marco
  aparecem como "a definir" computado na UI, não como linha vazia no banco).

## 10. IA

> **Implementado na Fase 5.** `context` fica `null` na prática (o contexto é montado sob
> demanda por `buildContextForUser()`, não persistido na conversa); o campo continua no schema
> para permitir persistir contexto estruturado no futuro sem migration. Ver
> `docs/ARCHITECTURE.md` e `docs/DECISIONS.md` para a interface `AIProvider` e as decisões de
> escopo (mock heurístico, fallback automático, rate limit em memória).

- **AIConversation**(userId, context Json?, createdAt) — uma conversa "contínua" por usuário
  (todas as interações do tutor acumulam nela)
- **AIMessage**(conversationId, role: `USER|ASSISTANT`, content, provider, tokensApprox?,
  createdAt) — `provider` grava qual provider respondeu (`mock` ou `openai`)

## 11. Importação

- **ImportJob**(sourceFile, contentHash, startedAt, finishedAt, createdCount, updatedCount,
  skippedCount, report JSON)
- **ImportWarning**(importJobId, excerpt, reason, targetEntityHint, needsReview bool)

## 12. Certificação (Etapa 8)

> Certificado **interno** da formação — não é uma certificação de mercado. Emitido só quando os
> 3 requisitos do semestre são cumpridos (checados sob demanda, sem cache): todas as semanas
> obrigatórias do semestre com `Lesson` `AVAILABLE` concluídas (`LessonCompletion`), o projeto
> final do semestre (`Phase.finalProject`) com `ProjectSubmission.status = DONE`, e a avaliação
> final do semestre (`Phase.finalAssessment`) com ao menos um `AssessmentAttempt` enviado.

- **Certification**(userId, phaseId, code único, issuedAt) — `@@unique([userId, phaseId])`,
  emitido uma única vez por usuário/semestre; `code` gerado como `APEA-S{order}-{uuid curto}`.

## Índices e constraints (mínimo)

- `User.email` único.
- `Week.number` único por `Program` (`@@unique([programId, number])`).
- `LessonCompletion` único por `(userId, lessonId)`.
- `ChecklistItemProgress` único por `(userId, checklistItemId)`.
- `UserSkillProgress` único por `(userId, skillId)` — **ainda não implementado** (Fase 4).
- `FlashcardReview` indexado por `(userId, nextReviewAt)` (fila de revisão) — implementado.
- `Note` indexado por `userId`; busca por texto via `contains`/`insensitive` do Prisma (≈ `ILIKE`),
  não `tsvector` — ver `docs/DECISIONS.md` ("Busca de anotações").
- Exclusão: soft delete (`archivedAt`/`status = ARCHIVED`) para conteúdo acadêmico e projetos;
  hard delete permitido para dados transacionais do próprio usuário (ex.: sessão descartada,
  anotação, meta — todos implementados como hard delete real).

O schema Prisma completo vive em `prisma/schema.prisma` e é a fonte de verdade final; este
documento descreve a intenção e pode ficar um passo atrás do schema durante a implementação.
