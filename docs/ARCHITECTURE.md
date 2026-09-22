# Architecture

## 1. Estilo

Monólito modular (Next.js App Router, TypeScript estrito). Sem microsserviços no MVP.
Organização por domínio, não por tipo de arquivo.

## 2. Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js (App Router) + React + TypeScript estrito |
| UI | Tailwind CSS + shadcn/ui + Lucide icons |
| Formulários/validação | React Hook Form + Zod |
| Banco | PostgreSQL |
| ORM | Prisma (migrations versionadas, seed) |
| Autenticação | Auth.js (NextAuth v5), provider Credentials, sessão JWT, papéis STUDENT/ADMIN |
| Qualidade | ESLint + Prettier, Vitest (unit/integration), Playwright (e2e) |
| Infra local | Docker + Docker Compose (Postgres com healthcheck) |
| IA | AI Gateway multi-provider (`mock`/`openai`/`claude`/`gemini`), roteado por tipo de tarefa |

Gerenciador de pacotes: **npm** (o prompt original menciona pnpm; ambiente disponível usa npm —
todos os scripts e comandos documentados usam npm).

## 3. Estrutura de pastas (domínio)

```text
src/
  app/                      # rotas (App Router) — camada fina, delega para módulos de domínio
    (public)/               # landing, login, register
    (app)/                  # área autenticada: dashboard, roadmap, learn, planner, ...
    admin/                  # área administrativa
    api/                    # route handlers (auth, ai, health, imports)
  modules/
    authentication/
    account/                 # nome/senha da própria conta (perfil fica em profile/)
    profile/                 # Profile (avatar, timezone, bio, manualCommitCount)
    curriculum/              # Program/Phase/Week/Lesson + status, roadmap, Semana 0
    curriculum-import/       # importador de Curso.md
    admin-curriculum/        # CRUD administrativo de semanas/aulas/flashcards/quiz
    planning/                # StudyPlan, StudyGoal, agendamento automático, .ics
    study-sessions/          # StudySession (cronômetro, Pomodoro), streak
    study-hub/               # cursos externos (ExternalCourse/Module/Lesson), fila de
                              # revisão unificada, estatísticas, histórico de atividade
    assessments/
    flashcards/              # SM-2
    notes/
    projects/                # Project, ProjectSubmission, CodeReview (revisão por IA)
    laboratories/
    skills/
    portfolio/               # PortfolioItem, GitHubProvider (RestGitHubProvider real)
    certifications/          # Certification interna por fase
    gamification/            # XP, nível, badges (só currículo nativo — ver DECISIONS.md)
    artificial-intelligence/ # AIProvider, AI Gateway (mock/openai/claude/gemini), personas,
                              # AIConversation/AIMessage, LessonQuestion
    architecture-advisor/    # página dedicada à persona Arquiteto (parser de sugestão)
    ai-labs/                 # empresa fictícia: departamentos, timeline de arquitetura
  components/                # UI compartilhada (shadcn/ui + composições) — sem regra de negócio
  lib/                       # db (prisma client), auth, env, logger, utils
  server/                    # server actions / services compartilhados entre módulos
  types/
docs/
prisma/
  schema.prisma
  migrations/
  seed.ts
tests/
  unit/
  integration/
  e2e/
```

Cada módulo de domínio segue internamente:

```text
modules/<domain>/
  components/    # client/server components específicos do domínio
  actions.ts      # server actions (mutações)
  queries.ts       # leituras (data access via Prisma)
  schema.ts        # Zod schemas de validação
  service.ts        # regra de negócio pura, testável sem Next.js
  types.ts
```

Regra: componentes React não contêm regra de negócio; chamam `actions`/`queries`, que chamam
`service`, que acessa dados via `queries`/Prisma. Integrações externas (IA, GitHub, e-mail,
storage, notificações) são acessadas apenas por interface (`*Provider`), nunca diretamente pelos
componentes ou pelas actions.

> A lista de módulos acima é a real (atualizada nesta auditoria); a divisão originalmente
> desenhada (`users/`, `learning/`, `progress/`, `notifications/`, `administration/`, `server/`
> como pastas próprias) não se sustentou 1:1 na implementação — esses domínios foram absorvidos
> por módulos mais específicos (`authentication`/`profile`/`account`, `curriculum`/`flashcards`/
> `assessments`, cálculo sob demanda sem tabela `Progress`, `admin-curriculum`) ou não foram
> implementados (`notifications`: não existe hoje nenhum canal de notificação — nem e-mail real
> nem in-app — fora do reset de senha em modo dev; ver `docs/DECISIONS.md`).
>
> **`storage` deixou de ser só aspiracional em 2026-09-22**: `FileStorageProvider`
> (`src/lib/storage/types.ts`) + `LocalFileStorageProvider` (disco local/volume Docker, fora de
> `public/`) são a implementação real para anexos de anotação (`NoteAttachment`). Único provider
> hoje; trocar por S3/R2 depois é implementar a interface de novo e trocar o export em
> `src/lib/storage/index.ts` — sem mudar `modules/notes`.

## 4. Server vs Client Components

- Server Components por padrão para leitura de dados (dashboard, roadmap, aula, admin lists).
- Client Components isolados para interatividade: formulários, cronômetro de sessão, toggles de
  checklist, editor de Markdown, gráficos.
- Mutações via Server Actions (`"use server"`) nos arquivos `actions.ts` de cada módulo.

## 5. Autenticação

Auth.js v5, Credentials provider (e-mail + senha, hash com `bcrypt`/`argon2`), sessão JWT
persistida em cookie httpOnly. Middleware protege `/(app)` e `/admin` por papel. Reset de senha:
fluxo desacoplado (`EmailProvider` interface) com modo de desenvolvimento que loga o link no
console/arquivo em vez de enviar e-mail real — documentado no README.

## 6. IA — AI Gateway multi-provider

> **Fase 5**: interface `AIProvider` + `MockAIProvider`/`OpenAIProvider` em
> `src/modules/artificial-intelligence/`. **Pós-Fase 6**: substituído o factory de provider único
> por um **AI Gateway** (`gateway.ts`) que roteia por tipo de tarefa entre múltiplos providers
> reais. Rate limit (15 req/5min por usuário) em memória; `MockAIProvider` não usa nenhum modelo
> local, só heurísticas de texto. Ver `docs/DECISIONS.md`.

```
Plataforma → AI Gateway (getProviderForTask) → { OpenAIProvider, ClaudeProvider, GeminiProvider, MockAIProvider }
```

```ts
interface AIProvider {
  readonly name: string;
  generateAnswer(input): Promise<...>
  summarizeContent(input): Promise<...>
  generateQuiz(input): Promise<...>
  suggestNextActivity(input): Promise<...>
  explainConcept(input): Promise<...>
}

type AITaskType = "TEACH" | "CODE_REVIEW" | "SUMMARIZE";
function getProviderForTask(taskType: AITaskType): AIProvider
```

- Roteamento fixo e determinístico por tarefa (nenhuma IA decide por outra IA): `TEACH` →
  OpenAI ou Claude (`AI_TEACHING_PROVIDER`, padrão OpenAI); `CODE_REVIEW` → sempre Claude;
  `SUMMARIZE` → sempre Gemini. Fora desse roteamento, dois fluxos usam um Gemini fixo
  (`getGeminiProvider()`, não passa por `getProviderForTask`): "Pergunte ao Professor" (diálogo
  embutido em cada aula) e a geração de laboratórios — decisão pontual do usuário, não parte da
  regra geral.
- Cada provider real (`OpenAIProvider`/`ClaudeProvider`/`GeminiProvider`) só é instanciado se sua
  variável de ambiente de chave estiver configurada (`AI_OPENAI_API_KEY`/`AI_CLAUDE_API_KEY`/
  `AI_GEMINI_API_KEY`); caso contrário o Gateway cai automaticamente para `MockAIProvider`, sem
  lançar erro — o sistema principal funciona 100% sem nenhuma chave de IA configurada.
- **Personas** (`personas.ts`): 5 papéis de conversa (Professor, Tech Lead, Arquiteto,
  Entrevistador, Cliente) implementados como um prompt de sistema por persona sobre o mesmo
  Gateway — não são agentes independentes nem multiagentes. `getProviderForPersona()` reaproveita
  o roteamento por tarefa (Tech Lead → `CODE_REVIEW`/Claude; as demais → `TEACH`). Usadas em
  `/ai-tutor` (aba "Conversar com uma persona"), na revisão de código de projetos/laboratórios
  (Tech Lead), na IA de Arquitetura (`/architecture`, Arquiteto) e na geração de conteúdo de aula
  (Professor).
- Todas as chamadas acontecem apenas em server actions — nunca no client. `AIMessage.provider`
  registra qual provider realmente respondeu cada interação (auditoria/custo); o mesmo campo
  existe em `LessonQuestion` (diálogo "Pergunte ao Professor", público na página da aula).
- `OllamaProvider` (execução local) está fora desta fase por custo de performance na máquina do
  aluno; a interface já é genérica o bastante para recebê-lo depois sem mudar o Gateway.
- **Custo de manutenção observado**: manter 3 providers reais simultâneos já causou pelo menos 3
  bugs reais em produção local (nome de modelo do Claude e do Gemini desatualizado — 404; cota
  diária do Gemini esgotada a meio de um lote, exigindo um segundo modelo) — ver
  `docs/DECISIONS.md`. Vale reavaliar se a complexidade de 3 providers reais + roteamento por
  tarefa + uma rota fixa extra ainda se paga para um produto de um único usuário.

## 7. Infraestrutura local

`docker-compose.yml`: serviço `db` (postgres:16-alpine) com healthcheck e volume nomeado;
serviço `app` opcional (Dockerfile multi-stage) para rodar o Next.js containerizado.
`.env.example` documenta todas as variáveis.

## 8. Observabilidade (base)

Logger estruturado (`lib/logger.ts`, JSON em produção), `/api/health` e `/api/ready`,
error boundary + handler central de exceções em route handlers e server actions. Preparado para
futura integração com OpenTelemetry/Prometheus/Grafana/Loki/CloudWatch, sem exigir essa infra
para rodar localmente.

## 9. Study Hub — cursos externos

Módulo separado do currículo nativo (`modules/study-hub/`), para o estudante acompanhar cursos
de **fora** da formação (Udemy, YouTube, qualquer plataforma). Três formas de importar um curso,
todas terminando na mesma prévia editável antes de confirmar:

- **Pasta local**: `folder-scan.ts` usa a File System Access API (`showDirectoryPicker`) —
  execução inteira no navegador (só Chrome/Edge, requer contexto seguro HTTPS/`localhost`);
  nenhum nome de arquivo ou conteúdo é enviado ao servidor. Subpastas viram módulos (em qualquer
  profundidade), arquivos soltos viram aulas.
- **Texto colado**: gramática fixa própria (`CURSO:`/`PASTA:`/`AULAS:`, `import-parser.ts`), 1
  nível de módulo só.
- **JSON colado**: formato `{course, modules: [{name, lessons, modules}]}`, recursivo.

`ExternalModule` é auto-referenciada (`parentModuleId`) para suportar submódulos em qualquer
profundidade — sem `include` recursivo do Prisma (não suportado para profundidade arbitrária), a
árvore é remontada em memória a partir de listas achatadas (`buildModuleTree` em `queries.ts`).

Reaproveita infraestrutura já existente em vez de duplicar: `StudySession.externalLessonId`
(mesma tabela do cronômetro nativo) para as sessões de estudo; `ActivityLogEntry` para o
histórico; e a fila de revisão do Study Hub (`/study-hub/review`) mistura `LessonReviewMark`
(currículo nativo) com `ExternalLesson.markedForReview` no mesmo resultado (`getReviewItems`).
Não reaproveitado: gamificação (XP/badges) — ver `docs/DECISIONS.md` e a seção de limitações do
README.

## 10. Evolução futura fora do MVP

Extração de módulos para serviços independentes, filas (RabbitMQ/Kafka), Kubernetes, múltiplos
agentes de IA, RAG com banco vetorial — só entram se/quando o currículo real cobrir esses tópicos
(ver princípio "nunca estudar uma tecnologia sem aplicá-la").
