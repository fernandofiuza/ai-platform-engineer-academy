# Implementation Plan

Trabalho em entregas verticais, fase por fase (ver prompt original, seção "FLUXO DE
IMPLEMENTAÇÃO"). Ao final de cada fase: lint, typecheck, testes relacionados, correções,
atualização deste arquivo e de `docs/DECISIONS.md`.

Legenda: `[ ]` não iniciado · `[~]` em andamento · `[x]` concluído

## Fase 1 — Fundação
- [x] Etapa 1: análise de `Curso.md` + documentação inicial (`docs/*.md`)
- [x] Projeto Next.js (App Router) + TypeScript estrito
- [x] Tailwind CSS + shadcn/ui + Lucide
- [x] Prisma + PostgreSQL (schema inicial mínimo: User/Profile)
- [x] Docker Compose (Postgres com healthcheck) + Dockerfile app
- [x] Autenticação (Auth.js, Credentials, papéis STUDENT/ADMIN, sessão)
- [x] Layout base + navegação (sidebar desktop / nav mobile) + tema claro/escuro
- [x] Design system inicial (tokens Tailwind, componentes base shadcn instalados)
- [x] Lint/typecheck/build verdes

## Fase 2 — Currículo
- [x] Modelo acadêmico (Program/Phase/Week/Lesson/Resource + ChecklistItem/Progress — versão
      mínima; Track/Module/Technology/Skill/Activity/Checkpoint adiados, ver DECISIONS.md)
- [x] Importador de `Curso.md` (`npm run curriculum:import`)
- [x] Seed reaproveitando o importador
- [x] Roadmap (lista / timeline / mapa por semestre) com filtros por fase/status
- [x] Semana 0 (checklist interativo, por usuário, com detalhes: nota/versão/evidência/revisão)
- [x] Página de aula (Markdown seguro, confiança, "o que aprendi/não entendi", concluir)

## Fase 3 — Aprendizagem
- [x] Progresso (LessonCompletion já existia; agregados calculados sob demanda via query,
      sem tabela `Progress` própria — ver DECISIONS.md)
- [x] Sessões de estudo (cronômetro persistente — sobrevive a refresh — com pausa/retomada)
- [x] Metas (StudyGoal: criar, reagendar, concluir/cancelar, excluir; destaque de atrasadas)
- [x] Planejador semanal (disponibilidade + estimativa básica) + calendário mensal
- [x] Anotações (7 modelos, tags, busca por texto, favoritos, vínculo opcional com aula)
- [x] Avaliações (quiz de múltipla escolha, correção automática, explicações)
- [x] Flashcards (SM-2 simplificado, com testes unitários em `tests/unit/sm2.test.ts`)

## Fase 4 — Prática profissional
- [x] Projetos (1 demonstrativo — "Construir a própria plataforma de estudos" — com submissão
      real: repo/deploy/decisões/retrospectiva/status)
- [x] Laboratórios (1 demonstrativo — preparar o ambiente Docker — com conclusão real)
- [x] Mapa de competências (14 competências extraídas de `Curso.md`, nível derivado de
      evidências reais — aulas concluídas via `LessonSkill` —, nunca autoavaliado)
- [x] Portfólio (checklist de qualidade de 14 itens + `GitHubProvider` desacoplado, não usado
      ainda)
- [x] AI Labs (10 departamentos + 24 marcos de arquitetura importados de `Curso.md`; admin
      marca "alcançado")
- [x] Gamificação (XP por ação, nível derivado, sequência de estudo já existente, 9 badges com
      condições reais verificadas a cada ação relevante)

## Fase 5 — IA
- [ ] Interface `AIProvider`
- [ ] `MockAIProvider` (padrão)
- [ ] `OpenAIProvider` opcional (env var)
- [ ] Tutor contextual (aula/módulo atual, dúvidas, sugestão de próxima atividade)
- [ ] Limites (tamanho de entrada, rate limit), logs de uso, aviso de erro possível

## Fase 6 — Administração e qualidade
- [ ] Área administrativa (CRUD do currículo, projetos, labs, quizzes, flashcards, etc.)
- [ ] Testes automatizados (unit/integration/e2e do fluxo crítico)
- [ ] Acessibilidade (navegação por teclado, labels, contraste)
- [ ] Segurança (rate limit, headers, sanitização, auditoria básica)
- [ ] Documentação final (README completo)
- [ ] Build de produção + revisão final

## Registro de execução

### 2026-07-22
- Repositório estava vazio (apenas `Curso.md`, sem commits). Iniciada Etapa 1: leitura integral
  de `Curso.md`, criação de `docs/PRODUCT_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`,
  `docs/CURRICULUM_IMPORT.md`, `docs/DECISIONS.md` e este arquivo. Próximo: iniciar Fase 1.
- **Fase 1 concluída.** Next.js 16 (App Router, TS estrito) + Tailwind + shadcn/ui (preset
  Nova) + Prisma 7 (driver adapter `@prisma/adapter-pg`) + PostgreSQL 16 via Docker Compose
  (healthcheck) + Dockerfile multi-stage (`output: standalone`) + Auth.js v5 (Credentials, JWT,
  papéis STUDENT/ADMIN, middleware `proxy.ts` protegendo `(app)` e `/admin`) + layout (sidebar
  desktop, sheet mobile, breadcrumbs, tema claro/escuro) + landing/login/registro reais +
  dashboard real (lê sessão + banco) + placeholders "Planejado para a Fase N" para as demais
  rotas de `/(app)` e `/admin` (nenhum link quebrado/404). Verificado ao vivo: `npm run
  typecheck`, `npm run lint`, `npm run build` (Turbopack e webpack) sem erros; `npm run dev`
  sobe em <1s; `docker compose up -d` deixa o Postgres healthy; `docker compose --profile app
  up --build` builda e sobe a imagem de produção; smoke test end-to-end via Playwright
  (registro → dashboard → logout → login → bloqueio de `/dashboard` sem sessão → bloqueio de
  `/admin` para STUDENT → acesso de ADMIN → placeholder de nav → toggle de tema) com 10/10
  checks. Decisões técnicas adicionais registradas em `docs/DECISIONS.md` (driver adapter do
  Prisma 7, `proxy.ts` em vez de `middleware.ts`, `"use client"` em componentes shadcn afetados
  por um bug de bundling RSC do pacote `radix-ui`, `trustHost: true` no Auth.js). README
  atualizado com instruções reais de setup. Próximo: Fase 2 — Currículo.
- **Fase 2 concluída.** Schema de currículo (`Program/Phase/Week/Lesson/Resource` +
  `ChecklistItem`/`ChecklistItemProgress` por usuário + `LessonCompletion` +
  `ImportJob`/`ImportWarning`), duas migrations aplicadas. Importador de `Curso.md`
  (`src/modules/curriculum-import/`) via âncoras literais + regex (arquivo não tem headings
  Markdown reais) — extrai Program, os 6 semestres e os 40 itens da Semana 0, cria as 104
  semanas vazias (`PLANNED`) distribuídas nos semestres; idempotente por hash de conteúdo;
  0 avisos na execução real. `npm run curriculum:import` e `prisma/seed.ts` reaproveitam a mesma
  função. Roadmap real em `/roadmap` (lista/timeline/mapa por semestre, com filtros) e
  `/roadmap/[weekId]` (checklist interativo por usuário para a Semana 0; aviso "Conteúdo
  detalhado ainda não definido" para semanas `PLANNED`). Página de aula real em `/learn` e
  `/learn/[lessonId]` (Markdown renderizado com `react-markdown` — sem HTML arbitrário —,
  formulário de conclusão com confiança 1–5 e reflexão, grava `LessonCompletion`). `/admin/imports`
  mostra o relatório da última importação e permite reimportar. Durante a implementação, um bug
  real foi encontrado e corrigido: `Curso.md` usa CRLF e a âncora de fim do bloco da Semana 0 não
  batia, fazendo o checklist "vazar" para o resto do arquivo (~230 itens em vez de 40) — corrigido
  normalizando quebras de linha no parser; dados incorretos apagados e reimportados antes de
  qualquer uso real. Também corrigido um `setState` que chamava a server action dentro do updater
  (React acusava "Cannot update Router while rendering"). Verificado ao vivo: `npm run
  typecheck`/`lint`/`build` (Turbopack e webpack) sem erros; `docker compose --profile app up
  --build` funcionando contra o mesmo Postgres containerizado já populado; smoke test
  Playwright cobrindo roadmap (todas as views), toggle de checklist persistindo após reload,
  semana `PLANNED` mostrando aviso, conclusão de aula refletida na listagem, e o fluxo
  administrativo de reimportação — 16/16 checks. Decisões (distribuição de semanas por semestre,
  escopo reduzido do schema, adiamento de `isManuallyEdited`) registradas em `docs/DECISIONS.md`.
  Próximo: Fase 3 — Aprendizagem.
- Commit inicial criado (`26e07b0`) cobrindo Fases 1 e 2, 132 arquivos (excluindo os reference
  docs de IA gerados pelo `prisma init` em `.agents/.claude/.windsurf`, que ficaram fora do
  versionamento — ver `docs/DECISIONS.md`).
- **Fase 3 concluída.** Novo schema (`StudyPlan`, `StudyGoal`, `StudySession`, `Note`,
  `Assessment`/`Question`/`AnswerOption`/`AssessmentAttempt`, `Flashcard`/`FlashcardReview`),
  uma migration puramente aditiva. Sessões de estudo com cronômetro que sobrevive a refresh
  (estado — `startedAt`/`pausedAt`/`totalPausedSeconds` — vive no banco, não no cliente),
  com pausar/retomar/finalizar (ratings de foco/dificuldade, reflexão, "concluí o conteúdo")
  e descartar. Planejador (`/planner`): disponibilidade semanal + estimativa automática básica
  de término (dias disponíveis vs. carga do programa) e metas (criar, reagendar, concluir,
  cancelar, excluir; atrasadas marcadas sem bloquear nada). Calendário mensal (`/calendar`)
  com navegação por mês, minutos estudados por dia e destaque dos dias planejados. Anotações
  (`/notes`): 7 modelos, tags livres, busca por título/conteúdo (`ILIKE` via Prisma
  `contains`/`insensitive`), favoritos, vínculo opcional com uma aula. Avaliações (`/assessments`,
  `/assessments/[id]`): quiz de múltipla escolha com correção automática e explicações; nota
  automática. Flashcards (`/flashcards`): fila de revisão por `nextReviewAt`, algoritmo SM-2
  simplificado em `src/modules/flashcards/sm2.ts`, coberto por 6 testes unitários (Vitest,
  `npm run test:unit`). Dashboard atualizado para mostrar dados reais (aulas concluídas, horas
  estudadas, sequência de dias, metas em aberto). Durante a implementação, o ESLint (com as
  regras do React Compiler) pegou 3 problemas reais antes de irem para produção: `Date.now()`
  chamado durante a renderização (impuro), e dois componentes sincronizando `props` para
  `state` dentro de `useEffect` (`setState` síncrono em efeito) — corrigidos com o padrão
  recomendado pelo React de comparar e ajustar o estado durante a própria renderização.
  Verificado ao vivo: `npm run typecheck`/`lint`/`build` sem erros nem avisos; `npm run
  test:unit` (6/6); smoke test Playwright cobrindo sessão completa (iniciar → pausar →
  retomar → finalizar → aparece no histórico), planejador (salvar disponibilidade → ver
  estimativa; criar meta → concluir), calendário, anotações (criar → buscar → favoritar),
  quiz (responder → nota 100%) e flashcards (revisar um cartão) — 16/16 checks, sem erros no
  console do navegador nem nos logs do servidor; `docker compose --profile app up --build`
  confirmado contra o mesmo Postgres. Decisões (schema mínimo por entrega vertical mantido,
  escopo de anotações, estimativa simples do planejador) registradas em `docs/DECISIONS.md`.
  Próximo: Fase 4 — Prática profissional.
- **Fase 4 concluída.** Schema novo (`Skill`/`LessonSkill`/`UserSkillProgress`,
  `Project`/`ProjectSubmission`, `Laboratory`/`LaboratoryCompletion`, `PortfolioItem`,
  `Department`/`ArchitectureMilestone`, `Badge`/`UserBadge`/`ExperienceEvent`), uma migration
  puramente aditiva. O importador de `Curso.md` foi estendido (âncoras "Teremos departamentos"
  e "Ela começará assim:") para extrair os 10 departamentos e os 24 marcos da linha do tempo de
  arquitetura da AI Labs — deliberadamente adiado da Fase 2 — com 0 avisos na execução real.
  Projetos (`/projects`, `/projects/[id]`) e Laboratórios (`/labs`, `/labs/[id]`) com 1 item
  demonstrativo cada (a própria plataforma como projeto; preparar o Docker como laboratório) e
  submissão/conclusão real por usuário. Mapa de competências (`/skills`): 14 competências
  extraídas das áreas de conhecimento citadas em `Curso.md`, nível (`NOT_STARTED` →
  `COMPETENT`) recalculado automaticamente a partir de evidências reais (aulas concluídas
  ligadas via `LessonSkill`) sempre que uma aula é concluída — nunca uma autoavaliação.
  Portfólio (`/portfolio`): checklist de 14 itens de qualidade por repositório, interface
  `GitHubProvider` desacoplada (não chamada ainda). AI Labs (`/ai-labs`): departamentos +
  timeline, com marcos "alcançados" só por ação explícita de um ADMIN (a importação nunca
  infere conclusão). Gamificação: `ExperienceEvent` (XP por aula/sessão/quiz/flashcard/
  laboratório/projeto concluído), nível derivado (100 XP por nível), 9 badges com condições
  reais (`checkAndAwardBadges`, chamado após cada ação relevante), painel de nível/badges no
  dashboard. Verificado ao vivo: `npm run typecheck`/`lint`/`build` sem erros; `npm run
  test:unit` (6/6); smoke test Playwright cobrindo submissão de projeto, conclusão de
  laboratório, mapa de competências, portfólio (adicionar + marcar checklist), AI Labs
  (departamentos + timeline + toggle exclusivo de admin) e badges aparecendo no dashboard —
  14/14 checks (1 falso-negativo de timing no próprio script de smoke, confirmado à parte);
  `docker compose --profile app up --build` confirmado contra o mesmo Postgres. Decisões
  (evidência de competência computada, não persistida como cache; sem ProjectEvidence/
  SkillEvidence polimórficas; GitHubProvider não integrado ainda) registradas em
  `docs/DECISIONS.md`. Próximo: Fase 5 — IA.
