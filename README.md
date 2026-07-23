# AI Platform Engineer Academy

**Da infraestrutura à inteligência artificial.**

Plataforma de estudos da formação *AI Platform Engineer Academy* (~24 meses, 104 semanas, 5
dias/semana, 3h30/dia). Combina, em um único produto: plataforma de cursos, painel de
acompanhamento, planejador de estudos, roadmap profissional, gerenciador de projetos/
laboratórios, caderno de anotações, construtor de portfólio, sistema de revisão (quizzes/
flashcards), tutor de IA e o histórico de evolução de uma empresa fictícia ("AI Labs").

`Curso.md` (raiz do repositório) é a fonte de verdade do conteúdo da formação. Tudo que não está
explicitamente definido lá aparece no produto como `PLANNED`/`DRAFT` — nunca como conteúdo
oficial inventado. Ver `docs/PRODUCT_SPEC.md`.

<!--
  Espaço reservado para screenshots do produto (dashboard, roadmap, tutor de IA, AI Labs).
  Adicionar em docs/screenshots/ e referenciar aqui, ex.:
  ![Dashboard](docs/screenshots/dashboard.png)
-->

## Funcionalidades

| Área | O que tem |
|---|---|
| Autenticação | Cadastro, login, logout, redefinição de senha, papéis `STUDENT`/`ADMIN` |
| Currículo | Roadmap das 104 semanas (lista/timeline/mapa por semestre), Semana 0 interativa, página de aula com Markdown seguro |
| Aprendizagem | Sessões de estudo com cronômetro persistente, planejador + metas, calendário mensal, anotações com busca, quizzes com correção automática, flashcards com repetição espaçada (SM-2) |
| Prática profissional | Projetos e laboratórios com submissão/conclusão real, mapa de competências com evidências reais, portfólio com checklist de qualidade, gamificação (XP/nível/badges) |
| AI Labs | Empresa fictícia: departamentos e linha do tempo de arquitetura, importados de `Curso.md` |
| Tutor de IA | Perguntar, resumir aula, gerar quiz, explicar de outro jeito, sugerir próxima atividade — funciona sem chave de IA (provider mock) |
| Administração | CRUD de currículo (semanas/aulas/flashcards/quiz), projetos, laboratórios; importação/reimportação de `Curso.md` |

## Stack

- **Frontend/app**: Next.js 16 (App Router) + React 19 + TypeScript estrito + Tailwind CSS +
  shadcn/ui + Lucide + React Hook Form + Zod
- **Banco de dados**: PostgreSQL 16 + Prisma 7 (driver adapter `@prisma/adapter-pg`)
- **Autenticação**: Auth.js v5 (Credentials, sessão JWT)
- **IA**: interface `AIProvider` desacoplada — mock (padrão) ou OpenAI (opcional)
- **Infra local**: Docker + Docker Compose
- **Qualidade**: ESLint (com regras do React Compiler), Vitest (unitários), Playwright (e2e)

## Arquitetura

Monólito modular organizado por domínio (não por tipo de arquivo) — ver `docs/ARCHITECTURE.md`
para a explicação completa. Resumo da estrutura de pastas:

```text
src/app/           rotas (App Router): (public), (app), admin, api
src/modules/        lógica de domínio (actions, queries, schemas, services, componentes)
src/components/     UI compartilhada (shadcn/ui + composições de layout)
src/lib/            db (Prisma), auth, logger, rate-limit, utils
prisma/             schema, migrations, seed
scripts/            importador de Curso.md
tests/unit/         testes unitários (Vitest)
tests/e2e/          teste end-to-end do fluxo crítico (Playwright)
docs/               documentação do produto/arquitetura/decisões
```

Regra seguida em todo o código: componentes React não contêm regra de negócio (chamam
`actions`/`queries` dos módulos); integrações externas (IA, GitHub) só são acessadas por
interface (`AIProvider`, `GitHubProvider`), nunca diretamente.

## Pré-requisitos

- Node.js 22+ e npm
- Docker Desktop (ou engine compatível) para o PostgreSQL local

## Instalação e execução local

### 1. Variáveis de ambiente

```bash
cp .env.example .env
```

Os valores padrão já funcionam para desenvolvimento local (banco via Docker Compose, IA em modo
`mock`, sem chaves externas necessárias). Ver `.env.example` para a lista comentada de todas as
variáveis (banco, `AUTH_SECRET`, IA).

### 2. Banco de dados

```bash
npm run docker:db      # sobe só o Postgres (healthcheck)
docker compose ps      # confirmar que está "healthy"
```

### 3. Instalar, migrar e popular

```bash
npm install
npm run db:migrate
npm run db:seed
```

O seed cria:

- 2 usuários de demonstração (**apenas para desenvolvimento local**):

  | Papel | E-mail | Senha |
  |---|---|---|
  | ADMIN | `admin@apea.dev` | `Demo@1234` |
  | STUDENT | `estudante@apea.dev` | `Demo@1234` |

- o currículo importado de `Curso.md` (programa, 6 semestres, as 104 semanas — a maioria ainda
  vazia/`PLANNED` — o checklist da Semana 0, os departamentos e a linha do tempo da AI Labs);
- 2 aulas de demonstração, 1 quiz, 3 flashcards, 14 competências, 1 projeto, 1 laboratório e o
  catálogo de 9 badges de gamificação — todos claramente demonstrativos (`isDemo: true` onde
  aplicável).

Para reimportar `Curso.md` manualmente (idempotente — só recria o que mudou):

```bash
npm run curriculum:import
npm run curriculum:import -- --force   # força mesmo com conteúdo idêntico
```

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse http://localhost:3000.

## Docker (app + banco)

```bash
docker compose --profile app up --build
```

Builda a imagem da aplicação (`Dockerfile`, multi-stage, saída `standalone` do Next.js) e sobe
`app` + `db`. Migrations/seed continuam manuais contra o banco (`npm run db:migrate` / `npm run
db:seed` do host, apontando para `localhost:5432`) — não há passo automático de migração no
start do container ainda.

## Testes

```bash
npm run test:unit    # Vitest — SM-2, sequência de estudo, checklist de portfólio, rate limit
npm run test:e2e     # Playwright — fluxo crítico completo (ver tests/e2e/critical-flow.spec.ts)
npm run test         # os dois
```

O teste e2e cobre exatamente o fluxo crítico exigido: registro/login → dashboard → abrir aula →
registrar sessão de estudo → concluir aula → ver progresso atualizado. Ele cria uma conta nova a
cada execução, então é repetível sem depender de estado de execuções anteriores. Requer o
servidor rodando (`npm run dev`) e o banco disponível.

## Scripts

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
| `npm run test:unit` / `test:e2e` / `test` | Testes unitários / e2e / os dois |

## Configuração de IA (tutor em `/ai-tutor`)

O tutor de IA funciona 100% sem nenhuma chave configurada — `AI_PROVIDER=mock` (padrão em
`.env.example`) usa um provider heurístico local (extração de frases, correspondência de
palavras-chave, regras simples), sem chamadas externas. Para ativar um provider real:

```bash
AI_PROVIDER=openai
AI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini   # opcional, esse é o padrão
```

Todas as chamadas acontecem no servidor (Server Actions) — nunca no navegador, e a chave nunca é
exposta ao cliente. Se `AI_PROVIDER=openai` estiver definido sem `AI_API_KEY`, o sistema cai
automaticamente para o mock (com aviso no log) em vez de quebrar. Limites: 15 solicitações a
cada 5 minutos por usuário e 4.000 caracteres por entrada.

## Segurança

- Senhas com hash `bcrypt`; validação de entrada no cliente (Zod + React Hook Form) e sempre
  também no servidor (mesmos schemas Zod nas Server Actions).
- Autorização por papel (`STUDENT`/`ADMIN`) em `src/proxy.ts` (nível de rota) e nas próprias
  Server Actions administrativas (defesa em profundidade).
- Rate limit em memória: login (10/15min por IP), registro (5/1h por IP), redefinição de senha
  (5/1h por IP), tutor de IA (15/5min por usuário). Documentado como não distribuído — precisa
  migrar para um store compartilhado (Redis) se o app rodar com múltiplas instâncias.
- Headers de segurança (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`) via `next.config.ts`.
- Nenhum uso de `dangerouslySetInnerHTML` — Markdown é renderizado via `react-markdown` sem
  suporte a HTML bruto.
- Auditoria básica de ações administrativas via logger estruturado (`admin_action`).
- Reset de senha desacoplado de provedor de e-mail: em desenvolvimento, o link aparece na tela
  em vez de ser enviado por e-mail real (não depende de infraestrutura externa).

## Documentação

- `docs/PRODUCT_SPEC.md` — o que foi extraído de `Curso.md` e o que ficou como `PLANNED`/`DRAFT`
- `docs/ARCHITECTURE.md` — arquitetura técnica completa
- `docs/DATA_MODEL.md` — modelo de dados completo, entidade por entidade
- `docs/CURRICULUM_IMPORT.md` — como a importação de `Curso.md` funciona (âncoras, idempotência)
- `docs/DECISIONS.md` — todas as decisões técnicas tomadas e por quê
- `docs/IMPLEMENTATION_PLAN.md` — plano de implementação por fase, com registro de execução

## Limitações conhecidas

- A grade semanal (semanas 1–104) está estruturada mas vazia (`"a definir"`), porque `Curso.md`
  não define conteúdo semana a semana — só os 6 semestres e a Semana 0. Preencher isso é
  trabalho de conteúdo pedagógico, não de engenharia, e fica para quando esse conteúdo existir.
- Rate limit e cache do provider de IA são em memória (não sobrevivem a reinício do processo,
  não são compartilhados entre múltiplas instâncias).
- Sem CRUD administrativo para `Skill`/`Badge`/`Department`/`ArchitectureMilestone` (mantidos
  via seed/importação); AI Labs permite só marcar um marco como "alcançado".
- `GitHubProvider` é uma interface criada mas nunca chamada — cadastro de repositório no
  portfólio é manual.
- Sem CSP (Content-Security-Policy) completa — só os headers básicos listados acima.
- Ver `docs/DECISIONS.md` para o racional completo de cada uma dessas escolhas de escopo.

## Roadmap

Ver `docs/IMPLEMENTATION_PLAN.md` para o roadmap técnico fase a fase (já concluído: Fases 1–6).
Próximos passos sugeridos, fora do escopo original deste MVP:

- Popular a grade semanal real conforme o conteúdo pedagógico das 104 semanas for definido.
- CRUD administrativo para competências, departamentos e badges.
- Integração real do `GitHubProvider` com a API do GitHub.
- Migrar rate limit e cache para um store compartilhado (Redis) para deploy multi-instância.
- Content-Security-Policy completa.

## Contribuição

Projeto pessoal de estudos — não está aberto a contribuições externas no momento. Sugestões e
observações podem ser registradas como issues no repositório.

## Licença

[MIT](LICENSE).
