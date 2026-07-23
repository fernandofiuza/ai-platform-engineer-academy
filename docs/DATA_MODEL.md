# Data Model

Modelo relacional (PostgreSQL + Prisma). Todas as entidades têm `id` (cuid), `createdAt`,
`updatedAt`. Conteúdo publicável tem `status` (`DRAFT | PLANNED | AVAILABLE | IN_PROGRESS |
COMPLETED | ARCHIVED`). JSON só é usado quando não há relacionamento razoável (ex.: payload bruto
de resposta de IA, metadados de importação).

## 1. Identidade e acesso

- **User**(id, email, passwordHash, name, role: `STUDENT|ADMIN`, createdAt, ...)
- **Profile**(userId 1:1, avatarUrl, timezone, studyPreferences JSON leve, bio)
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
- **Phase**(programId, order, name, label /* "Semestre N" */, status)
- **Track**(phaseId, order, name, status) — trilha dentro do semestre (ex.: Backend, Infra) — **ainda não implementado**
- **Module**(trackId, order, name, status) — **ainda não implementado**
- **Week**(programId, phaseId?, number 0–104, title, objective?, isEnvironmentSetup bool, status)
  — `phaseId` é opcional só para a Semana 0 (`number = 0`), que não pertence a nenhum semestre
- **Lesson**(weekId, order, title, objective, durationMinutes, contentMarkdown, isDemo, status)
  — `@@unique([weekId, order])`
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

- **Technology**(name, category, status)
- **Skill**(name, category, description, status)
- **LessonSkill**(lessonId, skillId) — N:N
- **UserSkillProgress**(userId, skillId, level: `NOT_STARTED|INTRO|PRACTICING|COMPETENT|
  ADVANCED`, updatedAt)
- **SkillEvidence**(userSkillProgressId, kind: `PROJECT|QUIZ|LAB|REPO|SESSION|NOTE|ASSESSMENT`,
  refId, description)

## 4. Projetos e laboratórios

- **Project**(title, problem, context, objective, requirements[], optionalRequirements[],
  technologies N:N, deliverables[], steps JSON, acceptanceCriteria[], repoUrl, deployUrl,
  architectureNotes, decisions, retrospective, status)
- **Laboratory**(title, objective, environment, prerequisites[], instructions, commands,
  expectedResult, validation, troubleshooting, status)
- **ProjectEvidence**(projectId|laboratoryId, kind: `REPO|DEPLOY|COMMIT|PR|ISSUE|DOC|IMAGE|
  COMMENT`, url/text)

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

- **PortfolioItem**(userId, projectId?, repoUrl, qualityChecklist JSON /* README, testes, CI/CD…
  */, status)
- **Badge**(code, name, description, icon)
- **UserBadge**(userId, badgeId, earnedAt)
- **ExperienceEvent**(userId, kind, points, refType?, refId?, createdAt)

## 9. AI Labs (empresa fictícia)

- **Department**(name, description, order)
- **ArchitectureMilestone**(order, title, description, layer /* infra/app/data/ai/... */,
  status, achievedAt?)

## 10. IA

- **AIConversation**(userId, context JSON leve /* lessonId, moduleId atual */, createdAt)
- **AIMessage**(conversationId, role: `USER|ASSISTANT`, content, provider, tokensApprox,
  createdAt)

## 11. Importação

- **ImportJob**(sourceFile, contentHash, startedAt, finishedAt, createdCount, updatedCount,
  skippedCount, report JSON)
- **ImportWarning**(importJobId, excerpt, reason, targetEntityHint, needsReview bool)

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
