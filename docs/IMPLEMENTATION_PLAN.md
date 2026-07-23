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
- [x] Interface `AIProvider` (`generateAnswer`/`summarizeContent`/`generateQuiz`/
      `suggestNextActivity`/`explainConcept`)
- [x] `MockAIProvider` (padrão de fábrica — heurístico, determinístico, sem chamada externa)
- [x] `OpenAIProvider` opcional (`AI_PROVIDER=openai` + `AI_API_KEY`; cai para o mock se a chave
      faltar, em vez de quebrar)
- [x] Tutor contextual (`/ai-tutor`): aula atual, aulas concluídas, metas em aberto, notas
      recentes de avaliações
- [x] Limites (tamanho de entrada via Zod, rate limit de 15 req/5min por usuário em memória),
      logs de uso (`AIConversation`/`AIMessage` + logger estruturado), aviso de erro possível
      na UI

## Fase 6 — Administração e qualidade
- [x] Área administrativa (`/admin/curriculum` — semanas/aulas/flashcards/quiz; `/admin/projects`;
      `/admin/labs`; `/admin/imports` já existia)
- [x] Testes automatizados (18 unitários com Vitest + 1 e2e com Playwright cobrindo o fluxo
      crítico completo)
- [x] Acessibilidade (labels associados, navegação e submissão por teclado verificadas,
      tab order revisado)
- [x] Segurança (rate limit em login/registro/reset de senha + IA, headers de segurança,
      sem `dangerouslySetInnerHTML` em lugar nenhum, auditoria básica via logger estruturado)
- [x] Documentação final (README completo)
- [x] Build de produção + revisão final

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
- **Fase 5 concluída.** `src/modules/artificial-intelligence/`: interface `AIProvider` com 5
  métodos; `MockAIProvider` heurístico (resume por extração de frases, gera quiz
  verdadeiro/falso a partir do próprio conteúdo, sugere próxima atividade por regras usando
  metas/aulas/notas reais, responde perguntas por correspondência de palavras-chave no
  conteúdo da aula atual) — nenhuma chamada externa, funciona sem qualquer chave configurada;
  `OpenAIProvider` real (Chat Completions, prompt com marcações anti-prompt-injection
  delimitando conteúdo do estudante) ativado só com `AI_PROVIDER=openai` + `AI_API_KEY` — se a
  chave faltar, cai para o mock automaticamente (logado como warning) em vez de quebrar.
  Contexto (`buildContextForUser`) reúne aula atual, aulas concluídas, metas em aberto e notas
  recentes — nada além disso, sem perfil comportamental. Rate limit em memória (15
  requisições/5min por usuário) e limite de tamanho de entrada via Zod (4000 caracteres).
  Cada chamada grava um par `AIMessage` (USER/ASSISTANT) em `AIConversation`, com o nome do
  provider, para histórico e auditoria básica de uso. UI em `/ai-tutor` com 5 abas (perguntar,
  resumir, gerar quiz, explicar de outro jeito, sugerir próxima atividade), aviso fixo de que
  respostas podem conter erros e qual provider está ativo. Verificado ao vivo: `npm run
  typecheck`/`lint`/`build` sem erros; smoke test Playwright cobrindo as 5 ações do tutor e
  persistência do histórico após reload (7/7 checks); teste dedicado confirmando que o rate
  limit dispara após 15 chamadas e que `AI_PROVIDER=openai` sem `AI_API_KEY` cai para o mock
  sem quebrar a página (com warning no log); `docker compose --profile app up --build`
  confirmado. Decisões (contexto mínimo, sem persistir perfil do estudante; rate limit em
  memória, não distribuído) registradas em `docs/DECISIONS.md`. Próximo: Fase 6 —
  Administração e qualidade.
- **Fase 6 concluída (formação encerrada).** Área administrativa real: `/admin/curriculum`
  lista as 105 semanas com filtro por status; `/admin/curriculum/[weekId]` edita
  título/objetivo/status da semana e gerencia aulas (criar/editar/arquivar, com Markdown,
  duração, status) e, dentro de cada aula, flashcards e perguntas de quiz (múltipla escolha,
  com opção correta marcada) — sem precisar de rotas administrativas separadas para isso, como
  decidido na Fase 3. `/admin/projects` e `/admin/labs` ganharam formulários completos
  (criar/editar/arquivar) reaproveitando os mesmos schemas/actions dos módulos de estudante,
  com campos de lista representados como texto (uma linha por item). Todas as ações admin
  passaram a chamar `logger.info("admin_action", ...)` para auditoria básica. Corrigido um gap
  real encontrado durante a revisão de acessibilidade: o link "Esqueci minha senha" no login
  apontava para `/esqueci-senha`, uma rota que nunca tinha sido implementada (só estava
  registrada como pública em `src/proxy.ts` desde a Fase 1) — implementado o fluxo completo de
  redefinição de senha (`PasswordResetToken`, já existente no schema desde a Fase 1, finalmente
  usado): `/esqueci-senha` gera um token e, em desenvolvimento, mostra o link diretamente na
  tela (sem enviar e-mail real); `/redefinir-senha?token=...` troca a senha e invalida o token
  (reuso do mesmo token é rejeitado). Segurança: rate limit (`src/lib/rate-limit.ts`,
  generalizado a partir do limitador da Fase 5) aplicado a login (10/15min por IP), registro
  (5/1h por IP) e redefinição de senha (5/1h por IP), além do já existente para a IA; headers
  de segurança (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`) via `next.config.ts`; confirmado que não há `dangerouslySetInnerHTML`
  em nenhum lugar do código. Testes: 18 testes unitários (Vitest — SM-2, streak, checklist de
  portfólio, rate limit) e 1 teste e2e (Playwright, `tests/e2e/critical-flow.spec.ts`) cobrindo
  o fluxo crítico completo exigido pela Etapa 29 (registro/login → dashboard → abrir aula →
  registrar sessão de estudo → concluir aula → ver progresso atualizado), commitado no
  repositório com `npm run test:unit` / `npm run test:e2e` / `npm run test`. Acessibilidade:
  verificado que todos os campos de formulário têm labels associados, que a navegação principal
  e os links são alcançáveis e ativáveis via teclado, e que o tab order do formulário de login
  segue a ordem visual (rótulo → link "esqueci senha" → campo de senha). Verificado ao vivo:
  `npm run typecheck`/`lint`/`build` sem erros nem avisos; suíte de testes unitários e e2e
  passando; smoke tests end-to-end via Playwright cobrindo CRUD administrativo completo
  (semana → aula → flashcard → quiz; projeto; laboratório), controle de acesso (estudante
  bloqueado de `/admin`), headers de segurança presentes na resposta HTTP, e o fluxo completo
  de esqueci/redefinir senha (incluindo rejeição de token reutilizado); `docker compose
  --profile app up --build` confirmado, com os headers de segurança presentes também no
  container. Decisões (auditoria via log estruturado em vez de tabela dedicada; escopo do CRUD
  administrativo sem reordenação por arrastar/soltar nem duplicação/pré-visualização; sem CSP
  completo, só os headers básicos) registradas em `docs/DECISIONS.md`.

Com a Fase 6 concluída, todas as seis fases do fluxo de implementação original foram entregues.
O relatório final de entrega está no encerramento desta conversa (fora deste arquivo).
