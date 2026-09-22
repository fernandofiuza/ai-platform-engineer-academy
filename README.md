# Apex

**Da infraestrutura à inteligência artificial.**

Plataforma de estudos da formação *Apex* (~24 meses, 104 semanas, 5
dias/semana, 3h30/dia; nome de produto original "AI Platform Engineer Academy", ver
`docs/DECISIONS.md`). Combina, em um único produto: plataforma de cursos, painel de
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
| Currículo | Roadmap visual estilo roadmap.sh (Trilha Formação, Produto e Profissional), Semana 0 interativa, página de aula com Markdown seguro, modo foco e tamanho de fonte ajustável na leitura |
| Aprendizagem | Sessões de estudo com cronômetro persistente + modo Pomodoro, planejador com agendamento automático por aula + exportação `.ics`, calendário mensal, anotações com busca/favoritos/vínculo com aula/semana/**tema (`Topic`)**/**anexos de arquivo** (imagem, PDF, texto — até 10MB), indicador visual de anotação existente onde quer que aulas/semanas sejam listadas, quizzes com correção automática, flashcards com repetição espaçada (SM-2) |
| **Study Hub** | Acompanhamento de **cursos externos** (Udemy, YouTube, qualquer plataforma): importação por leitura de pasta local (File System Access API, nada é enviado ao servidor), texto colado ou JSON; progresso por curso/módulo/aula (módulos aninhados em qualquer profundidade), fila de revisão unificada (aulas do currículo + aulas externas marcadas), estatísticas (horas, sequência, progresso por curso, gráficos de 30 dias/12 semanas) e histórico de atividade — ver `/study-hub` |
| Prática profissional | Projetos e laboratórios com submissão/conclusão real e **revisão de código por IA** (persona Tech Lead), mapa de competências com evidências reais, portfólio com checklist de qualidade e **sincronização real com o GitHub** (README/licença/CI/release), certificação interna por fase, gamificação (XP/nível/badges) |
| AI Labs | Empresa fictícia: departamentos e linha do tempo de arquitetura, importados de `Curso.md` |
| Tutor de IA | **5 personas** (Professor, Tech Lead, Arquiteto, Entrevistador, Cliente) sobre um **AI Gateway multi-provider** (OpenAI/Claude/Gemini, roteado por tipo de tarefa) — perguntar, resumir aula, gerar quiz, explicar de outro jeito, sugerir próxima atividade, "Pergunte ao Professor" em cada aula, IA de Arquitetura (`/architecture`) — tudo funciona sem nenhuma chave configurada (fallback automático para o provider mock) |
| Administração | CRUD de currículo (semanas/aulas/flashcards/quiz), projetos, laboratórios; importação/reimportação de `Curso.md` e de `Grade_Curricular.md`; geração de conteúdo assistida por IA (aulas e laboratórios) |

## Stack

- **Frontend/app**: Next.js 16 (App Router) + React 19 + TypeScript estrito + Tailwind CSS +
  shadcn/ui + Lucide + React Hook Form + Zod
- **Banco de dados**: PostgreSQL 16 + Prisma 7 (driver adapter `@prisma/adapter-pg`)
- **Autenticação**: Auth.js v5 (Credentials, sessão JWT)
- **IA**: AI Gateway multi-provider (`src/modules/artificial-intelligence/`) — interface
  `AIProvider` desacoplada, roteada por tipo de tarefa entre `mock` (padrão, sem chave), `openai`,
  `claude` e `gemini`; 5 personas de conversa sobre o mesmo Gateway
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

- o currículo importado de `Curso.md` (programa, 6 fases, as 104 semanas — a maioria ainda
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

## Configuração de IA (tutor em `/ai-tutor`, IA de Arquitetura, revisão de código, geração de conteúdo)

Toda a plataforma funciona 100% sem nenhuma chave de IA configurada — o **AI Gateway**
(`src/modules/artificial-intelligence/gateway.ts`) cai automaticamente para o `MockAIProvider`
(heurístico local, sem chamadas externas) para qualquer tarefa cujo provider real não tenha
chave configurada. Para ativar os providers reais:

```bash
AI_OPENAI_API_KEY=sk-...
AI_CLAUDE_API_KEY=sk-ant-...
AI_GEMINI_API_KEY=...
AI_TEACHING_PROVIDER=openai   # ou "claude" — só afeta a tarefa TEACH, ver abaixo
```

O Gateway roteia por **tipo de tarefa**, não por escolha manual do usuário: `TEACH` (perguntas,
explicações, quiz, sugestão de atividade, personas de conversa exceto Tech Lead) → OpenAI ou
Claude (`AI_TEACHING_PROVIDER`, padrão OpenAI); `CODE_REVIEW` (persona Tech Lead) → sempre
Claude; `SUMMARIZE` → sempre Gemini. Os fluxos "Pergunte ao Professor" (dentro de cada aula) e a
geração de laboratórios usam um Gemini fixo (`getGeminiProvider()`), independente desse
roteamento. Cada provider real só é instanciado se sua própria chave estiver configurada —
qualquer combinação parcial de chaves funciona, o resto cai no mock automaticamente (com aviso no
log), sem quebrar o produto. Todas as chamadas acontecem no servidor (Server Actions) — nunca no
navegador, e nenhuma chave é exposta ao cliente. Limites: 15 solicitações a cada 5 minutos por
usuário (10 para a IA de Arquitetura) e 4.000 caracteres por entrada.

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
- Upload de anexo de anotação (`NoteAttachment`): tipo e tamanho (10MB) validados no cliente e
  sempre também no servidor; nome de arquivo sanitizado antes de salvar; armazenamento
  (`src/lib/storage/`, local hoje) fica fora de `public/` e só é servido por
  `GET /api/notes/attachments/[id]`, autenticado e dono-only, com `Content-Type` sempre resolvido
  no servidor a partir de um mapa fixo extensão→mimetype (nunca o que o cliente mandou) e
  `X-Content-Type-Options: nosniff` — nunca executável como script mesmo que o nome do arquivo
  tente sugerir isso.

## Documentação

- `docs/PRODUCT_SPEC.md` — o que foi extraído de `Curso.md` e o que ficou como `PLANNED`/`DRAFT`
- `docs/ARCHITECTURE.md` — arquitetura técnica completa
- `docs/DATA_MODEL.md` — modelo de dados completo, entidade por entidade
- `docs/CURRICULUM_IMPORT.md` — como a importação de `Curso.md` funciona (âncoras, idempotência)
- `docs/DECISIONS.md` — todas as decisões técnicas tomadas e por quê
- `docs/IMPLEMENTATION_PLAN.md` — plano de implementação por fase, com registro de execução

## Limitações conhecidas

- A grade semanal já tem conteúdo real (importado de `Grade_Curricular.md`, não mais
  `"a definir"`), mas em dois formatos: as semanas iniciais já foram regeneradas no formato
  aprofundado (aula por dia, escrita pela persona Professor via IA real e revisada) e o restante
  ainda está no formato mais leve original (1 aula/semana). O estado exato avança a cada rodada
  de geração de conteúdo — ver `docs/DECISIONS.md` para o histórico completo.
- Rate limit e cache do provider de IA são em memória (não sobrevivem a reinício do processo,
  não são compartilhados entre múltiplas instâncias).
- Sem CRUD administrativo para `Skill`/`Badge`/`Department` (mantidos via seed/importação).
  `ArchitectureMilestone` já tem CRUD completo para as trilhas Produto/Profissional
  (`/admin/curriculum/[weekId]`); a trilha AI Labs continua só com "marcar como alcançado".
- Gamificação (XP/badges) considera apenas o currículo nativo (aulas/laboratórios/projetos/
  quizzes) — progresso registrado no Study Hub (cursos externos) não gera XP nem badges, mesmo
  contando para as sessões de estudo e para a sequência de dias.
- Sem CSP (Content-Security-Policy) completa — só os headers básicos listados acima.
- Anexos de anotação ficam em disco local (volume Docker em produção, ver `docker-compose.yml` e
  `NOTES_STORAGE_DIR`) via `LocalFileStorageProvider` — funciona com uma instância; múltiplas
  instâncias/réplicas precisariam de um volume compartilhado ou trocar por um provider de
  storage de objeto (S3/R2) implementando a mesma interface (`FileStorageProvider`).
- Ver `docs/DECISIONS.md` para o racional completo de cada uma dessas escolhas de escopo.

## Roadmap

Ver `docs/IMPLEMENTATION_PLAN.md` para o roadmap técnico fase a fase (já concluído: Fases 1–6,
mais uma série de expansões pós-Fase 6 — personas de IA, code review por IA, IA de Arquitetura,
certificação interna, sync real com GitHub, `.ics`, Pomodoro, modo foco, o Study Hub, o redesign
visual completo e anotações com tema/anexo).
Próximos passos sugeridos, fora do escopo original deste MVP:

- Popular a grade semanal real (formato aprofundado) para as semanas que ainda estão no formato
  leve original.
- CRUD administrativo para competências, badges e departamentos da AI Labs.
- Migrar rate limit e cache para um store compartilhado (Redis) para deploy multi-instância.
- Content-Security-Policy completa.

### Sugestões avaliadas em 2026-09-11 (auditoria de funcionalidades)

A pedido do usuário, o código foi varrido em busca de funcionalidades que ajudariam mais os
estudos e de pontos de complexidade que valeriam simplificar. Ainda não implementadas — registradas
aqui e em `docs/DECISIONS.md` como sugestões, para decisão posterior:

**Para adicionar:**

- Fila de revisão diária unificada: hoje flashcards vencidos (`/flashcards`), aulas/cursos
  marcados para revisão (`/study-hub/review`) e aulas com confiança baixa
  (`LessonCompletion.confidence` 1–2, hoje não usado para nada) vivem em telas/critérios
  separados. Um único painel "revisar hoje", ordenado por urgência, reduziria a fricção de abrir
  3 lugares diferentes.
- Gamificação (XP/badges) também para o Study Hub — hoje só currículo nativo concede XP/badges,
  mesmo o Study Hub tendo sessões de estudo e progresso reais.
- Contexto da IA incluir as próprias anotações do usuário (`buildContextForUser` já usa aulas
  concluídas/metas/notas de quiz, mas nunca o conteúdo de `Note`) — respostas mais alinhadas ao
  que o estudante já escreveu.
- Resumo periódico automático (semanal/mensal) do que foi estudado, tempo investido vs.
  planejado e pendências — útil tanto para manter o ritmo quanto como material bruto para contar
  a própria trajetória depois (portfólio, entrevistas).
- Consolidar os 3 métodos de importação do Study Hub (pasta local, texto no formato
  `CURSO:/PASTA:/AULAS:`, JSON) em torno da leitura de pasta, que já cobre o caso comum sem
  exigir memorizar sintaxe nenhuma.

**Para remover/simplificar:**

- Roteamento fixo do AI Gateway entre 3 providers reais (OpenAI/Claude/Gemini) + uma rota extra
  fixa em Gemini fora desse roteamento (`getGeminiProvider`) — já causou ao menos 3 bugs reais
  documentados (nome de modelo desatualizado no Claude e no Gemini, cota diária do Gemini
  esgotada). Para um produto de um único usuário, considerar consolidar em 1 provider principal +
  mock, e só voltar a multi-provider se custo/quota real exigir.
- Página `/architecture` dedicada — é um wrapper fino em torno da persona Arquiteto, que já é
  acessível dentro do Tutor de IA (`/ai-tutor`, aba "Conversar com uma persona"); dobra a
  navegação de IA sem funcionalidade nova.
- Scripts de importação/geração de conteúdo de uso único, já aplicados (`curriculum:import-grade`,
  `import-lessons`, `generate-lessons-gemini`, `generate-labs-gemini`, `export-real-content`,
  `import-real-content`, `import-daily-lessons`) — considerar mover para `scripts/archive/` para
  não parecerem parte do fluxo normal de uso do dia a dia.

## Contribuição

Projeto pessoal de estudos — não está aberto a contribuições externas no momento. Sugestões e
observações podem ser registradas como issues no repositório.

## Licença

[MIT](LICENSE).
