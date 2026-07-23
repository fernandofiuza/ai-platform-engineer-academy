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
- [ ] Progresso (LessonCompletion, Progress agregada)
- [ ] Sessões de estudo (cronômetro persistente)
- [ ] Metas (StudyGoal)
- [ ] Planejador semanal + calendário
- [ ] Anotações (templates + busca)
- [ ] Avaliações (quiz/checkpoint)
- [ ] Flashcards (SM-2 simplificado)

## Fase 4 — Prática profissional
- [ ] Projetos
- [ ] Laboratórios
- [ ] Mapa de competências
- [ ] Portfólio (checklist de qualidade + GitHubProvider desacoplado)
- [ ] AI Labs (departamentos + timeline de arquitetura)
- [ ] Gamificação (XP, níveis, streak, badges)

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
