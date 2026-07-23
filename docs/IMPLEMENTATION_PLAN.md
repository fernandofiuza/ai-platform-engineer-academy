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

- **Pós-Fase 6: importação de `Grade_Curricular.md`.** O usuário forneceu uma grade curricular
  real e mais detalhada (24 módulos — Módulo 0 a 10 mais os blocos de IA/RAG/n8n/MCP/OpenCode/
  Hermes/OpenClaw/Multiagentes/Segurança/Observabilidade/FinOps/SaaS/Engenharia de Soluções — e
  um Projeto Final "APEX Academy"), a ser distribuída pelas 104 semanas já existentes sem
  recriar a estrutura. Implementado um segundo importador (`grade-parser.ts` +
  `grade-distribution.ts` + `importModuleGrid()`, comandos `npm run curriculum:preview-grade` e
  `npm run curriculum:import-grade`), reaproveitando o padrão de idempotência via `ImportJob` já
  usado pelo importador de `Curso.md`, sem substituí-lo. Adicionado `Week.isManuallyEdited`
  (adiado desde a Fase 2, agora com o CRUD administrativo real como precondição) para proteger
  semanas editadas manualmente contra reimportação. Distribuição calculada pelo método dos
  maiores restos (peso = contagem de linhas de tópico por módulo, piso mínimo de 4) e revisada
  com o usuário via dry-run (`curriculum:preview-grade`) antes de qualquer escrita no banco.
  Aplicada: 104 semanas atualizadas (título + objetivo), 0 preservadas (nenhuma edição manual
  existia ainda), "Projeto Final: APEX Academy" criado como `Project` (29 componentes como
  `deliverables`) — mantendo AI Labs e APEX Academy como entidades distintas, conforme instrução
  explícita do usuário. Verificado: `npm run typecheck`/`lint` sem erros; 5 testes unitários
  novos (`tests/unit/grade-distribution.test.ts`); estado do banco conferido por amostragem
  (semanas 1, 7, 8, 62, 100–104 e o `Project` do Projeto Final). Decisões registradas em
  `docs/DECISIONS.md`.
- **Pós-Fase 6: correção do `status` + geração de aulas reais para as 104 semanas.** Ao
  conferir o roadmap ao vivo no navegador, o usuário notou que as semanas importadas ainda
  mostravam o card "conteúdo detalhado ainda não definido" mesmo com título real — bug real:
  `importModuleGrid` esquecia de gravar `status = AVAILABLE`. Corrigido e reaplicado com
  `--force`. Em seguida, o usuário reportou que o Dashboard/`/learn` só mostravam as 2 aulas de
  demonstração da Semana 0 — a importação da grade só criava `Week`, nunca `Lesson`. Implementada
  `importGradeLessons()` (`grade-lessons.ts`, comando `npm run curriculum:import-lessons`), que
  gera 1 aula real por semana (104 no total) a partir dos tópicos de cada módulo (já extraídos
  pelo parser para calcular peso, agora também expostos em `ParsedModule.topics` e distribuídos
  em fatias contíguas entre as semanas do módulo), com uma estrutura pedagógica completa
  (objetivo, tópicos da semana, laboratório guiado, exercícios, "como a AI Labs faria", projeto
  do módulo na última semana, checklist). Verificado ao vivo no navegador (login como estudante,
  `/learn` lista os 24 temas reais, `/learn/[id]` de uma aula real renderiza todas as seções e o
  fluxo de concluir aula continua funcionando); `npm run typecheck`/`lint`/`test:unit` sem erros.
  Decisões (bug do `status`, escopo do conteúdo gerado — estrutura completa mas sem explicação
  didática aprofundada por tecnologia, que fica para edição incremental via admin) registradas em
  `docs/DECISIONS.md`.
- **Etapa 1 (IA multi-provider): AI Gateway.** Substituído o factory de provider único por um
  AI Gateway (`gateway.ts`, `getProviderForTask("TEACH"|"CODE_REVIEW"|"SUMMARIZE")`) que roteia
  entre `OpenAIProvider`, `ClaudeProvider` (novo), `GeminiProvider` (novo) e `MockAIProvider` por
  tipo de tarefa: ensino → OpenAI ou Claude (`AI_TEACHING_PROVIDER`, padrão OpenAI); revisão de
  código → sempre Claude; resumo de conteúdo longo → sempre Gemini. Cada provider real só ativa
  com sua chave própria (`AI_OPENAI_API_KEY`/`AI_CLAUDE_API_KEY`/`AI_GEMINI_API_KEY`); sem chave,
  cai automaticamente para o Mock, sem quebrar o sistema. `/ai-tutor` mostra o roteamento atual
  (ensino/resumo/revisão de código) em vez de um único "provider ativo". Ollama propositalmente
  não implementado (custo de performance local — fica para fase futura). Verificado ao vivo no
  navegador (login como estudante, `/ai-tutor` mostra "ensino: mock, resumo: mock, revisão de
  código: mock" sem nenhuma chave configurada, e as 5 ações do tutor continuam funcionando);
  `npm run typecheck`/`lint`/`test:unit` sem erros. Decisões registradas em `docs/DECISIONS.md`.
- **Etapa 2 (IA multi-provider): Personas do Mentor de IA.** Adicionado `converse()` à
  interface `AIProvider` e um módulo `personas.ts` com 5 personas (Professor, Tech Lead,
  Arquiteto, Entrevistador, Cliente) — cada uma um prompt de sistema especializado, sem
  orquestração de agentes. Nova aba "Conversar com uma persona" em `/ai-tutor`: o aluno escolhe
  a persona antes de enviar a mensagem; `getProviderForPersona()` reaproveita o roteamento por
  tarefa da Etapa 1 (Tech Lead → CODE_REVIEW/Claude; demais → TEACH). `MockAIProvider` dá uma
  resposta heurística própria por persona, sempre identificada como mock. Verificado ao vivo no
  navegador (login como estudante, trocar para persona Tech Lead, enviar um trecho de código e
  receber nota + sugestões + aviso de "avaliação assistida por IA"); `npm run
  typecheck`/`lint`/`test:unit` sem erros. Decisões (escopo — Tech Lead/Arquiteto aqui são só
  conversa; os fluxos estruturados com histórico persistido e diagrama vêm nas Etapas 6 e 7)
  registradas em `docs/DECISIONS.md`.
- **Etapa 3 (IA multi-provider): geração e persistência do conteúdo das aulas.** Adicionados
  `Lesson.isManuallyEdited` e `Lesson.aiGeneratedAt` (migration `lesson_ai_generation`).
  `generateLessonContentAction` usa a persona Professor (Etapa 2) para reescrever o conteúdo já
  existente da aula (tópicos/checklist da importação da grade) em uma aula completa e
  aprofundada — objetivo, explicação, analogias, 80/20, exemplos, checklist, exercícios —
  salvando com `status = DRAFT` (nunca publicado automaticamente). `approveLessonContentAction`
  é o único caminho DRAFT → AVAILABLE. Se a aula já foi editada manualmente, exige confirmação
  explícita antes de sobrescrever. Se nenhum provider real (OpenAI/Claude) estiver configurado, a
  geração é recusada (evita substituir conteúdo estruturado real por um resumo genérico do
  Mock). Disparo escolhido: **manual** (botão "Gerar conteúdo com IA" em
  `/admin/curriculum/[weekId]`), não automático na primeira visita — motivo documentado em
  `docs/DECISIONS.md`. Banners de "aguardando revisão" no editor admin e em `/learn/[lessonId]`
  (caso um DRAFT seja acessado por link direto). Verificado ao vivo: sem chave configurada, o
  botão mostra a recusa esperada em vez de degradar o conteúdo; `npm run
  typecheck`/`lint`/`test:unit` sem erros.
- **Etapa 4: Trilha "Produto" em paralelo à Trilha "Formação".** `ArchitectureMilestone` (já
  usado pela AI Labs desde a Fase 4) ganhou `track` (`AI_LABS|PRODUCT`) e `weekId` opcional único,
  em vez de um domínio novo. `/roadmap` ganhou um seletor de trilha reaproveitando a mesma
  estrutura de lista/timeline/mapa; `/roadmap/[weekId]` mostra o marco de produto vinculado (ou
  "a definir"); `/admin/curriculum/[weekId]` ganhou um formulário para criar/editar o marco de
  produto da semana. Nenhum marco de produto foi pré-criado em massa (tabela esparsa — só existe
  quando o admin define). Verificado ao vivo: criado um marco de teste ("Autenticação da área do
  aluno") na Semana 8 via admin, confirmado que aparece na Trilha Produto do roadmap (lista e
  card da semana) e que a AI Labs (`/ai-labs`) continua mostrando só os 24 marcos próprios,
  filtrados por `track = AI_LABS`; `npm run typecheck`/`lint`/`test:unit` sem erros. Decisões
  registradas em `docs/DECISIONS.md`.
- **Etapa 5: estatísticas reais no dashboard.** Dashboard expandido de 3 para 6 cartões, todos
  vindos de dados reais: horas estudadas e sequência de estudo (reordenadas para o topo),
  aulas concluídas, projetos concluídos (`ProjectSubmission` com `status = DONE`), commits
  registrados (`Profile.manualCommitCount`, novo campo editável inline pelo estudante — manual
  porque a integração real com GitHub é opcional), domínio por tecnologia (média de
  `SKILL_LEVEL_PROGRESS` sobre todas as competências). Cartão "Próximas entregas" corrigido (não
  listava mais Fase 5/6 como pendentes, já concluídas há muito). Verificado ao vivo: os 6
  cartões aparecem com os valores reais do estudante demo, e editar o campo de commits (42) e
  salvar atualiza o cartão imediatamente; `npm run typecheck`/`lint`/`test:unit` sem erros.
  Decisões registradas em `docs/DECISIONS.md`.
- **Etapa 6: Code Review com nota via IA.** Novo modelo `CodeReview` (histórico completo,
  vinculado a `ProjectSubmission`). `requestCodeReviewAction` usa a persona Tech Lead (Etapa 2,
  roteada para Claude/Mock pelo Gateway) para revisar com base nas informações da submissão
  (repoUrl, decisões, retrospectiva) e nos requisitos do projeto — não há leitura real do
  repositório (integração com GitHub segue não implementada). Nota extraída por regex da
  resposta em texto livre (`null` se não encontrada). Rate limit dedicado (5/10min). Novo
  `CodeReviewPanel` em `/projects/[projectId]`: botão de solicitar revisão (desabilitado sem
  `repoUrl`), aviso de "avaliação assistida por IA, não uma nota oficial", e histórico completo
  de revisões anteriores. Verificado ao vivo: vinculada uma URL de repositório, solicitada uma
  revisão, nota 7.0 extraída corretamente do mock, badge de provider e histórico exibidos;
  `npm run typecheck`/`lint`/`test:unit` sem erros. Decisões registradas em `docs/DECISIONS.md`.
- **Etapa 7: IA de Arquitetura.** Nova página `/architecture` (módulo
  `architecture-advisor`, sem tabela nova — ferramenta de exploração pontual, sem histórico).
  `requestArchitectureSuggestionAction` usa a persona Arquiteto pedindo um formato parseável
  (`"- **Componente**: justificativa"`); `parseArchitectureComponents()` extrai a lista por
  regex, com fallback para texto bruto se a IA não seguir o formato. "Diagrama" renderizado como
  cartões conectados por setas (sem adicionar a biblioteca `mermaid` — mesma decisão já tomada
  para a AI Labs). `MockAIProvider` ajustado para responder no mesmo formato parseável, mantendo
  a funcionalidade útil sem nenhuma chave de IA configurada. Verificado ao vivo: descrito um
  problema ("integrar Firebird com IA"), gerados 5 componentes com justificativa, renderizados
  como diagrama esquemático; `npm run typecheck`/`lint`/`test:unit` sem erros. Decisões
  registradas em `docs/DECISIONS.md`.
- **Etapa 8: certificação interna por semestre.** Novo modelo `Certification` (o prompt afirmava
  que já existia no schema — não era verdade neste projeto; criado do zero, ver
  `docs/DECISIONS.md`). `Phase.finalProjectId`/`finalAssessmentId` (FKs opcionais únicas, mesmo
  padrão da Trilha Produto da Etapa 4) marcam qual projeto/avaliação conta como "final do
  semestre", definidos pela área administrativa em `/admin/curriculum` (novo
  `PhaseRequirementsForm`). `requestCertificationAction` verifica os 3 requisitos (semanas
  obrigatórias concluídas, projeto final `DONE`, avaliação final com tentativa enviada) e emite
  um certificado idempotente por usuário/semestre. Novas páginas `/certifications` (visão geral
  dos 6 semestres com requisitos e botão de emissão) e `/certifications/[id]` (certificado,
  deixando claro que é interno, não uma certificação de mercado). Verificado ao vivo: forçados
  temporariamente os pré-requisitos do Semestre 1 para o estudante demo, confirmado o fluxo
  completo (elegibilidade → emissão → visualização do certificado) e revertido depois — nenhum
  dado de teste ficou no banco; `npm run typecheck`/`lint`/`test:unit` sem erros. Decisões
  registradas em `docs/DECISIONS.md`.

Com isso, as Etapas 1 a 8 do prompt de evolução de IA multi-provider e funcionalidades de
produto foram entregues.

- **Pós-Etapa 8: correções reais de infraestrutura de IA + "Pergunte ao Professor" + unidade de
  conteúdo por dia.** Ao configurar chaves reais de Claude/Gemini, três bugs reais foram achados
  e corrigidos no `ClaudeProvider`: modelo `claude-3-5-sonnet-latest` não existia mais na API
  (404) — trocado para `claude-sonnet-5`; parsing da resposta assumia texto sempre no índice 0
  do array `content`, quebrando com blocos de "thinking" — corrigido para procurar o primeiro
  bloco `type: "text"`; `max_tokens` baixo demais truncava aulas completas — subido para 16000.
  Persona Professor (`personas.ts`) e o prompt de geração de aula
  (`buildLessonGenerationMessage`) foram reforçados contra respostas genéricas ("vá pesquisar a
  documentação"), exigindo explicação completa própria antes de qualquer referência externa.
  Adicionado card "Pergunte ao Professor" ao final de `/learn/[lessonId]`, linkando para
  `/ai-tutor?lessonId=...` com a persona Professor e o contexto da aula pré-selecionados.
  A unidade de conteúdo passou de semana para **dia** (`Program.weeklyDays`, 5): nova
  `buildDailyLessons()` + `importGradeDailyLessons()` substituem (não só criam) as aulas de
  semanas informadas por 1 aula/dia, preservando semanas com edição manual. Aplicado ao módulo
  Preparação (semanas 1–7): 35 aulas diárias geradas e cada uma aprofundada individualmente pela
  persona Professor via Claude real, revisadas e aprovadas. As demais 97 semanas continuam no
  formato legado (1 aula/semana) até serem regeneradas da mesma forma. Decisões registradas em
  `docs/DECISIONS.md`.
- **Módulo Fundamentos da Computação regenerado no formato por dia (semanas 8–19).** Mesmo
  processo do Preparação: `importGradeDailyLessons` substituiu as 12 aulas semanais por 60 aulas
  diárias (5/semana), cada uma aprofundada individualmente pela persona Professor via Claude
  real e aprovada. Durante o processo, uma migration (`laboratory_lesson_link`, ver item
  seguinte) foi aplicada com o servidor de dev já rodando e interrompeu o lote no meio (Prisma
  Client desatualizado) — corrigido reiniciando o servidor, o lote retomou exatamente de onde
  parou sem perda de nenhuma aula já gerada. Verificado: 60/60 aulas com conteúdo real e
  aprovadas (`status = AVAILABLE`).
- **Laboratórios vinculados à aula que os originou.** `Laboratory` ganhou `lessonId` opcional +
  `isManuallyEdited`/`aiGeneratedAt` (mesmo padrão de `Lesson`). Toda tela de laboratório agora
  mostra "Referente à Semana N: <aula>" (`/labs`, `/labs/[labId]` com link de volta para a aula,
  `/admin/labs`). Novo `generateLabContentAction` (persona Professor) gera um laboratório guiado
  passo a passo completo — um único documento Markdown com comandos reais e resultado esperado
  por passo — direto do editor da aula (`/admin/curriculum/[weekId]`, novo `LessonLabPanel`),
  salvo em `DRAFT` até aprovação. `/labs/[labId]` passou a renderizar `instructions` com
  `<Markdown>` em vez de texto puro. Verificado ao vivo: gerado e aprovado um laboratório para a
  Semana 8/Dia 1 (Computação), com passos reais (`lscpu`, `free -h`, compilação em C, `objdump`,
  comparação com Python) e o card de vínculo com a aula visível na página pública. Decisões
  registradas em `docs/DECISIONS.md`.
- **Módulo Linux regenerado no formato por dia (semanas 20–25).** Mesmo processo: 30 aulas
  diárias geradas, aprofundadas pela persona Professor via Claude real e aprovadas. Verificado:
  30/30 com conteúdo real (amostra: Semana 21/Dia 2 — Bash, 15275 chars, explicação técnica
  precisa de shell interativo vs. linguagem de script); confirmado por varredura completa que
  não há nenhuma aula presa em `DRAFT` no banco (lição da correção anterior aplicada — aprovação
  em lote rodada logo após a revisão, antes de seguir para a próxima tarefa).
- **Módulo Redes regenerado no formato por dia (semanas 26–31 — nota: a distribuição real tem
  6 semanas para este módulo, não 7; confirmado consultando os títulos das semanas no banco
  antes de aplicar).** 30 aulas diárias geradas, aprofundadas pela persona Professor via Claude
  real e aprovadas. Confirmado por varredura completa: 0 aulas em `DRAFT` no banco.
O relatório final de entrega está no encerramento desta conversa (fora deste arquivo).
