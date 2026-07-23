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
| IA | Interface `AIProvider` desacoplada; providers `mock` e `openai` selecionáveis por env var |

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
    users/
    curriculum/             # Program/Phase/Track/Module/Week/Lesson + status
    learning/                # LessonCompletion, quizzes/flashcards runtime
    planning/                # StudyPlan, StudyGoal, calendário
    progress/
    study-sessions/
    assessments/
    flashcards/
    notes/
    projects/
    laboratories/
    skills/
    portfolio/
    gamification/
    notifications/
    artificial-intelligence/ # AIProvider, mock/openai, AIConversation
    administration/
    ai-labs/                 # empresa fictícia: departamentos, timeline de arquitetura
    curriculum-import/       # importador de Curso.md
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

## 6. IA

> **Implementado na Fase 5** em `src/modules/artificial-intelligence/`, exatamente como descrito
> abaixo. Rate limit (15 req/5min por usuário) em memória; `MockAIProvider` não usa nenhum
> modelo local, só heurísticas de texto. Ver `docs/DECISIONS.md`.

```ts
interface AIProvider {
  generateAnswer(input): Promise<...>
  summarizeContent(input): Promise<...>
  generateQuiz(input): Promise<...>
  suggestNextActivity(input): Promise<...>
  explainConcept(input): Promise<...>
}
```

- `MockAIProvider`: respostas determinísticas/heurísticas, usado por padrão e em testes.
- `OpenAIProvider` (ou compatível): ativado via `AI_PROVIDER=openai` + `AI_API_KEY`, chamado
  apenas em route handlers/server actions — nunca no client.
- Sistema principal funciona 100% sem chave de IA configurada.

## 7. Infraestrutura local

`docker-compose.yml`: serviço `db` (postgres:16-alpine) com healthcheck e volume nomeado;
serviço `app` opcional (Dockerfile multi-stage) para rodar o Next.js containerizado.
`.env.example` documenta todas as variáveis.

## 8. Observabilidade (base)

Logger estruturado (`lib/logger.ts`, JSON em produção), `/api/health` e `/api/ready`,
error boundary + handler central de exceções em route handlers e server actions. Preparado para
futura integração com OpenTelemetry/Prometheus/Grafana/Loki/CloudWatch, sem exigir essa infra
para rodar localmente.

## 9. Evolução futura fora do MVP

Extração de módulos para serviços independentes, filas (RabbitMQ/Kafka), Kubernetes, múltiplos
agentes de IA, RAG com banco vetorial — só entram se/quando o currículo real cobrir esses tópicos
(ver princípio "nunca estudar uma tecnologia sem aplicá-la").
