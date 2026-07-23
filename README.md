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

## Configuração de IA (opcional)

O tutor de IA (Fase 5) é opcional e desligado por padrão (`AI_PROVIDER=mock` em `.env.example`):
o sistema funciona 100% sem nenhuma chave configurada. Para ativar um provider real, defina
`AI_PROVIDER=openai` e `AI_API_KEY` no `.env` — as chamadas acontecem sempre no servidor, nunca
no navegador.

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
`docs/IMPLEMENTATION_PLAN.md`). Concluídas: **Fase 1** (fundação — auth, layout, design system) e
**Fase 2** (currículo — roadmap real, Semana 0 interativa, página de aula, importador de
`Curso.md`). As demais áreas (planejador, sessões, projetos, laboratórios, competências,
portfólio, AI Labs, gamificação, tutor de IA, administração além da importação) ainda estão com
páginas de placeholder (`"Planejado para a Fase N"`) em vez de dados reais — isso é intencional,
não um bug. A grade semanal (semanas 1–104) está estruturada mas vazia (`"a definir"`), porque
`Curso.md` não define conteúdo semana a semana — só os 6 semestres e a Semana 0.
