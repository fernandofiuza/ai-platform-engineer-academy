# AI Platform Engineer Academy

Plataforma de estudos da formação **AI Platform Engineer Academy** — da infraestrutura à
inteligência artificial. Ver `Curso.md` (fonte de verdade do conteúdo) e `docs/` (arquitetura,
modelo de dados, decisões, plano de implementação).

> Este README cobre o essencial para rodar o projeto localmente. A versão completa (screenshots,
> roadmap, licença etc.) chega na Fase 6, junto com a documentação final.

## Stack

Next.js (App Router) + TypeScript estrito · Tailwind CSS + shadcn/ui · Prisma 7 + PostgreSQL ·
Auth.js v5 (Credentials) · Docker / Docker Compose.

## Pré-requisitos

- Node.js 22+ e npm
- Docker Desktop (ou engine compatível) para o PostgreSQL local

## 1. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Os valores padrão já funcionam para desenvolvimento local (banco via Docker Compose, IA em modo
`mock`, sem chaves externas necessárias).

## 2. Subir o PostgreSQL

```bash
npm run docker:db
```

Sobe só o serviço `db` (Postgres 16 com healthcheck). Confirmar que está saudável:

```bash
docker compose ps
```

## 3. Instalar dependências, migrar e popular o banco

```bash
npm install
npm run db:migrate
npm run db:seed
```

O seed cria dois usuários de demonstração (**apenas para desenvolvimento local**) e importa o
currículo a partir de `Curso.md` (programa, 6 semestres, as 104 semanas — a maioria ainda vazia
— e o checklist da Semana 0), além de 2 aulas de demonstração:

| Papel     | E-mail               | Senha       |
|-----------|-----------------------|-------------|
| ADMIN     | `admin@apea.dev`      | `Demo@1234` |
| STUDENT   | `estudante@apea.dev`  | `Demo@1234` |

Para reimportar `Curso.md` manualmente (idempotente — só recria o que mudou):

```bash
npm run curriculum:import
```

## 4. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse http://localhost:3000.

## Rodando tudo em Docker (app + banco)

```bash
docker compose --profile app up --build
```

Isso builda a imagem da aplicação (`Dockerfile`, build multi-stage, saída `standalone` do
Next.js) e sobe `app` + `db`. As migrations/seed continuam sendo executadas manualmente contra o
banco (`npm run db:migrate` / `npm run db:seed` do host, apontando `DATABASE_URL` para
`localhost:5432`) — não há um passo automático de migração no start do container ainda.

## Scripts úteis

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Turbopack) |
| `npm run build` / `npm run start` | Build e start de produção |
| `npm run lint` / `npm run typecheck` | Lint (ESLint) e checagem de tipos |
| `npm run db:migrate` | Aplica migrations do Prisma (`migrate dev`) |
| `npm run db:deploy` | Aplica migrations em modo não interativo (`migrate deploy`) |
| `npm run db:seed` | Popula o banco com dados de demonstração |
| `npm run db:studio` | Abre o Prisma Studio |
| `npm run docker:db` | Sobe só o Postgres via Docker Compose |
| `npm run docker:app` | Builda e sobe app + banco via Docker Compose |
| `npm run curriculum:import` | Importa/reimporta o currículo a partir de `Curso.md` |
| `npm run test:unit` | Testes unitários (Vitest) — hoje cobre o algoritmo SM-2 dos flashcards |

## Configuração de IA (tutor em /ai-tutor)

O tutor de IA já está implementado (Fase 5) e funciona 100% sem nenhuma chave configurada —
`AI_PROVIDER=mock` (padrão em `.env.example`) usa um provider heurístico local, sem chamadas
externas. Para ativar um provider real:

```bash
AI_PROVIDER=openai
AI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini   # opcional, esse é o padrão
```

As chamadas acontecem sempre no servidor (Server Actions), nunca no navegador. Se
`AI_PROVIDER=openai` estiver definido sem `AI_API_KEY`, o sistema cai automaticamente para o
mock (com aviso no log) em vez de quebrar. Há um limite de 15 solicitações a cada 5 minutos por
usuário e um limite de tamanho de entrada (4.000 caracteres).

## Estrutura do projeto

Ver `docs/ARCHITECTURE.md` para a explicação completa (monólito modular por domínio). Resumo:

```text
src/app/          rotas (App Router): (public), (app), admin, api
src/modules/       lógica de domínio (actions, queries, schemas, services)
src/components/    UI compartilhada (shadcn/ui + composições de layout)
src/lib/           db (Prisma), auth, logger, utils
prisma/            schema, migrations, seed
docs/              documentação do produto/arquitetura/decisões
```

## Documentação

- `docs/PRODUCT_SPEC.md` — o que foi extraído de `Curso.md` e o que ficou como `PLANNED`/`DRAFT`
- `docs/ARCHITECTURE.md` — arquitetura técnica
- `docs/DATA_MODEL.md` — modelo de dados
- `docs/CURRICULUM_IMPORT.md` — como a importação de `Curso.md` funciona
- `docs/DECISIONS.md` — decisões técnicas e por quê
- `docs/IMPLEMENTATION_PLAN.md` — plano de implementação por fase e progresso atual

## Limitações atuais

Este é um projeto em construção, entregue em fases verticais (ver
`docs/IMPLEMENTATION_PLAN.md`). Concluídas: **Fase 1** (fundação — auth, layout, design system),
**Fase 2** (currículo — roadmap real, Semana 0 interativa, página de aula, importador de
`Curso.md`), **Fase 3** (aprendizagem — sessões de estudo com cronômetro persistente,
planejador + metas, calendário mensal, anotações com busca, avaliações com correção automática,
flashcards com repetição espaçada), **Fase 4** (prática profissional — 1 projeto e 1
laboratório demonstrativos com submissão/conclusão real, mapa de competências com nível
derivado de evidências reais, portfólio com checklist de qualidade, AI Labs com departamentos e
linha do tempo de arquitetura importados de `Curso.md`, gamificação com XP/nível/badges) e
**Fase 5** (tutor de IA em `/ai-tutor` — perguntar, resumir, gerar quiz, explicar de outro
jeito, sugerir próxima atividade — com provider mock por padrão e provider OpenAI opcional).
A administração ainda é só a importação (`/admin/imports`) — CRUD completo do currículo,
projetos, laboratórios, quizzes e flashcards fica para a Fase 6, junto com testes automatizados
formais, acessibilidade revisada e segurança adicional (headers, auditoria). A grade semanal
(semanas 1–104) está estruturada mas vazia (`"a definir"`), porque `Curso.md` não define
conteúdo semana a semana — só os 6 semestres e a Semana 0.
