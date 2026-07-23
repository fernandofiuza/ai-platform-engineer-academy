# Decisions Log

Registro de decisões tomadas quando `Curso.md` ou o prompt não definiam algo explicitamente.
Critério padrão: solução mais simples, segura, testável, extensível e adequada ao MVP.

## 2026-07-22 — Gerenciador de pacotes

**Decisão**: usar `npm` em vez de `pnpm` em todos os scripts/comandos/documentação.
**Motivo**: instrução explícita do usuário — ambiente disponível usa npm.

## 2026-07-22 — Nome oficial do produto

**Decisão**: manter "AI Platform Engineer Academy" como nome do produto no MVP. A ideia
"APEX Academy" (guarda-chuva de múltiplas formações) fica registrada como possível evolução
futura, não implementada agora — o texto-fonte trata isso como sugestão em aberto, não como
decisão fechada.
**Motivo**: `Curso.md` termina o brainstorming inclinado para "APEX Academy", mas sem confirmação
do usuário; a última formação nomeada com clareza e consistência ao longo de todo o documento é
"AI Platform Engineer Academy".

## 2026-07-22 — Semestres vs. Fases

**Decisão**: o modelo de dados usa `Phase` como entidade (nome técnico), mas a UI em português
exibe "Semestre" quando a fase representa um dos 6 semestres citados no arquivo. As 104 semanas
são distribuídas nos 6 semestres apenas estruturalmente (contagem), sem conteúdo semanal
inventado.
**Motivo**: `Curso.md` introduz "semestre" como rótulo amigável de módulo de alto nível; o prompt
técnico usa `Phase` na hierarquia sugerida (`Program > Phase > Track > Module > Week > Lesson`).

## 2026-07-22 — Autenticação

**Decisão**: Auth.js (NextAuth v5) com Credentials provider e sessão JWT, em vez de outro
serviço de auth externo (Clerk/Auth0).
**Motivo**: não exigir serviço pago/externo para rodar localmente (limite explícito do prompt);
Auth.js é a solução padrão da comunidade Next.js e roda 100% local com Postgres.

## 2026-07-22 — Reset de senha

**Decisão**: fluxo de redefinição de senha gera token e, em desenvolvimento, expõe o link via log
estruturado / rota de debug em vez de enviar e-mail real. Interface `EmailProvider` desacoplada
permite plugar um provedor real (Resend, SES, SMTP) depois.
**Motivo**: envio real de e-mail exige infraestrutura externa (limite: não depender de serviço
pago para rodar localmente).

## 2026-07-22 — Grade de 104 semanas

**Decisão**: criar as 104 linhas de `Week` (estrutura vazia, distribuídas entre os 6 semestres),
todas com `status = PLANNED`, título provisório (`"Semana N — a definir"`) e aviso
"Conteúdo detalhado ainda não definido". Nenhum conteúdo de aula é inventado.
**Motivo**: exigência explícita do prompt ("crie a estrutura das 104 semanas, mas preencha
somente os conteúdos que possam ser derivados com segurança do arquivo").

## 2026-07-22 — IA nível 1

**Decisão**: `MockAIProvider` é o padrão de fábrica (`AI_PROVIDER=mock`); provider real
(`openai`, compatível com API Chat Completions) é opcional via env var. Nenhuma chamada de IA
acontece no client.
**Motivo**: limite explícito — sistema deve funcionar sem chave de IA; segurança — chaves nunca
expostas ao navegador.

## 2026-07-22 — Busca

**Decisão**: busca via `tsvector`/`ILIKE` nativo do PostgreSQL no MVP, sem Elasticsearch/Algolia.
**Motivo**: limite explícito de não adicionar mecanismo externo sem necessidade comprovada.

## 2026-07-22 — Testes e2e

**Decisão**: Playwright para o fluxo crítico (login → dashboard → aula → sessão → conclusão →
progresso); Vitest para unit/integration.
**Motivo**: combinação padrão e leve para stack Next.js/TS, sem infraestrutura extra.

## 2026-07-22 — Prisma 7: driver adapter em vez de engine binário

**Decisão**: usar `@prisma/adapter-pg` + `pg`, com `PrismaClient({ adapter })`, em vez do motor
de query binário tradicional.
**Motivo**: Prisma 7 exige um driver adapter para PostgreSQL (o gerador `prisma-client` não
inclui mais engine embutido); é o caminho oficial documentado pelos próprios skills instalados
pelo `prisma init` (`.agents/skills/prisma-database-setup/references/postgresql.md`).

## 2026-07-22 — `proxy.ts` em vez de `middleware.ts`

**Decisão**: o arquivo de proteção de rotas foi criado como `src/proxy.ts` (função `default`
envolvendo `auth(...)`), não `src/middleware.ts`.
**Motivo**: no Next.js 16, `middleware.ts` está depreciado em favor de `proxy.ts`, que roda no
runtime Node.js por padrão (documentado em `node_modules/next/dist/docs/.../proxy.md`). Isso
também resolveu um erro de build (`node:path`/`node:url` não suportados no Edge Runtime) causado
pela Credentials provider do Auth.js importar Prisma/bcrypt.

## 2026-07-22 — `"use client"` em `button.tsx`, `badge.tsx`, `breadcrumb.tsx` (shadcn)

**Decisão**: adicionar `"use client"` a esses três componentes gerados pelo shadcn (preset
"Nova"), que por padrão não o têm.
**Motivo**: o pacote consolidado `radix-ui@1.6.5` (usado para `Slot`) não expõe uma condição de
export `react-server`; importar `Slot` a partir de um Server Component puxa o bundle inteiro do
pacote para o grafo do servidor e quebra o build (`TypeError: d.createContext is not a function`,
reproduzido tanto em Turbopack quanto em webpack). Forçar esses três arquivos a serem Client
Components contorna o bug sem tocar no restante dos componentes shadcn (que já tinham
`"use client"` corretamente).

## 2026-07-22 — `trustHost: true` no Auth.js

**Decisão**: configurar `trustHost: true` no `NextAuth(...)` de `src/lib/auth.ts`.
**Motivo**: rodando em container Docker (sem estar atrás da infraestrutura da Vercel), o Auth.js
v5 rejeita o `Host` header por padrão (`UntrustedHost`). `trustHost: true` é a configuração
recomendada pela própria documentação do Auth.js para deploys autogerenciados (self-hosted).

## 2026-07-22 — `LessonCompletion` antecipado para a Fase 2

**Decisão**: o modelo `LessonCompletion` (parte do domínio "progress", originalmente Fase 3) foi
incluído já na Fase 2, junto com o restante do modelo acadêmico.
**Motivo**: sem ele, o botão "concluir aula" da página de aula (Etapa 9) seria decorativo, o que
viola o limite explícito do prompt "não deixe botões sem funcionamento". O restante do domínio de
progresso (agregação de `Progress`, dashboard de horas, sequência de estudo) continua na Fase 3.

## 2026-07-22 — Escopo do importador de `Curso.md` na Fase 2

**Decisão**: a importação criada na Fase 2 popula apenas `Program`, `Phase` (6 semestres),
`Week` 1–104 (vazias, `PLANNED`) e os `ChecklistItem` da Semana 0. As entidades `Department` e
`ArchitectureMilestone` (AI Labs) também são extraíveis do mesmo arquivo, mas a criação delas
fica para a Fase 4, quando a seção "AI Labs" da plataforma for implementada.
**Motivo**: manter a entrega vertical da Fase 2 focada em currículo, evitando modelar/expor dados
de um domínio (AI Labs) que ainda não tem UI nem CRUD — consistente com "trabalhe em entregas
verticais, fase por fase" do fluxo de implementação.

## 2026-07-23 — Fase 2: schema mínimo por entrega vertical (Track/Module, Technology/Skill, Activity/Checkpoint adiados)

**Decisão**: o schema da Fase 2 inclui `Program`, `Phase`, `Week`, `ChecklistItem` +
`ChecklistItemProgress`, `Lesson`, `Resource`, `LessonCompletion`, `ImportJob`/`ImportWarning` —
mas **não** inclui `Track`/`Module` (nível entre Fase e Semana), `Technology`/`Skill`/
`LessonSkill`, nem `Activity`/`Checkpoint`, apesar de estarem na hierarquia sugerida em
`docs/DATA_MODEL.md` e terem sido mencionados no plano aprovado desta fase.
**Motivo**: nenhuma dessas entidades tinha dado real para popular nem tela que as leia nesta
fase — `Curso.md` não define módulos/trilhas nem competências por aula, e `Activity`/
`Checkpoint` não têm conteúdo de origem. Criar essas tabelas vazias e sem UI violaria o limite
explícito "não faça overengineering". Elas entram quando o domínio que as usa for construído
(competências → Fase 4; avaliações/checkpoints → Fase 3).

## 2026-07-23 — Distribuição das 104 semanas entre os 6 semestres

**Decisão**: as semanas são distribuídas em faixas contíguas o mais uniformemente possível
(104 ÷ 6 = 17 semanas base + 2 semestres com 18): Semestre 1 (1–18), 2 (19–36), 3 (37–53),
4 (54–70), 5 (71–87), 6 (88–104).
**Motivo**: `Curso.md` não define em qual semana cada semestre começa/termina — apenas lista os
6 semestres nomeados. Distribuição uniforme é a opção mais simples e neutra; fica documentada
para poder ser revisada quando um plano semanal real existir.

## 2026-07-23 — Importador: `Curso.md` usa CRLF (bug real encontrado e corrigido)

**Decisão/observação**: o parser normaliza `\r\n` → `\n` no início de `parseCursoMarkdown`,
antes de qualquer comparação de âncora literal.
**Motivo**: `Curso.md` usa quebras de linha estilo Windows (CRLF). A primeira versão do parser
usava a âncora literal `"\nDepois\n"` para delimitar o fim do checklist da Semana 0; como o
arquivo real tem `"\r\nDepois\r\n"`, a âncora nunca era encontrada e o bloco "vazava" para o
resto do documento, criando ~230 itens de checklist (em vez de 40) a partir de palavras soltas
como "Docker"/"IA" repetidas em outras seções. Detectado e corrigido nesta sessão antes de
qualquer uso em produção; os dados incorretos foram apagados (`checklist_items`, `import_jobs`
— nenhum dado de usuário real existia ainda) e a importação foi re-executada corretamente.

## 2026-07-23 — `isManuallyEdited` da importação adiado

**Decisão**: `docs/CURRICULUM_IMPORT.md` descreve um campo `isManuallyEdited` para impedir que a
reimportação sobrescreva edições manuais feitas pela área administrativa. Esse campo **não**
foi adicionado ao schema na Fase 2.
**Motivo**: a área administrativa de edição de currículo (CRUD) é Fase 6 — antes disso não existe
nenhum caminho de código que edite `Week`/`ChecklistItem` manualmente, então não há nada para
proteger ainda. O campo entra no schema junto com o CRUD administrativo.

## 2026-07-23 — `LessonCompletion` sem tabela `Progress` agregada

**Decisão**: a Fase 2 grava `LessonCompletion` (por usuário/aula) mas não cria a entidade
`Progress` agregada (percentual por programa/fase/módulo) descrita em `docs/DATA_MODEL.md`.
**Motivo**: com apenas 2 aulas de demonstração existentes, uma tabela de agregação não tem o que
agregar de forma significativa ainda.
**Atualização (Fase 3)**: a decisão final foi **não criar** a tabela `Progress` — o dashboard
calcula os agregados sob demanda via `COUNT`/`SUM` (aulas concluídas, minutos estudados,
sequência de dias) em `src/app/(app)/dashboard/page.tsx`. Uma tabela de cache/agregação só se
justifica quando o volume de dados tornar as queries lentas; até lá, manter dois lugares de
verdade (linhas de origem + tabela agregada) seria complexidade sem benefício mensurável.

## 2026-07-23 — Fase 3: schema mínimo mantido (Progress, Attempt.answers em JSON, sem Track/Module ainda)

**Decisão**: além do ponto acima, a Fase 3 também: (a) usa `Json` em
`AssessmentAttempt.answers` (mapa `questionId -> optionId`) em vez de uma tabela relacional de
respostas — justificado porque o formato varia por tipo de pergunta e nunca é consultado
individualmente, só lido de volta inteiro para exibir o resultado; (b) `Question.type` inclui
`SHORT_ANSWER` no schema, mas nenhuma pergunta desse tipo é usada na avaliação de demonstração
nem entra no cálculo de nota (não há correção automática possível sem revisão humana/IA) — ela
fica disponível para quando a Fase 5 (tutor de IA) ou uma revisão manual puderem avaliá-la.
**Motivo**: manter a mesma disciplina de "schema mínimo por entrega vertical" das fases
anteriores.

## 2026-07-23 — Anotações: sem página de detalhe, vínculo só com aula

**Decisão**: `Note` suporta `scopeType` (`LESSON`/`WEEK`/`GENERAL`) no schema, mas a interface
(`/notes`) só oferece vínculo com **aula** (`LESSON`) via um seletor opcional; não há seletor de
semana/módulo/projeto/tecnologia, nem uma página de detalhe por anotação (edição é feita inline
via modal na própria listagem).
**Motivo**: as demais entidades vinculáveis (`Week`, `Project`, `Technology`, `Skill`) ou ainda
não existem no schema (`Technology`/`Skill` — Fase 4) ou o vínculo não agregaria valor real com
apenas 2 aulas de demonstração no sistema. Uma página de detalhe dedicada não se justifica
enquanto a edição inline resolve o mesmo caso de uso com menos código.

## 2026-07-23 — Planejador: estimativa simples, sem motor de reagendamento automático

**Decisão**: `/planner` calcula uma estimativa de término (`totalWeeks * weeklyDays /
availableDays.length`, a partir da data de início) como texto informativo, mas não implementa
um motor de "redistribuição automática de atividades" nem cria/move tarefas sozinho. Férias e
indisponibilidades são um campo de texto livre (`StudyPlan.notes`), não datas estruturadas
consideradas no cálculo.
**Motivo**: o prompt original pede "planejamento automático **básico**" — um motor de
redistribuição de atividades pressupõe que existam atividades/aulas reais o suficiente para
redistribuir, o que ainda não é o caso (grade de 104 semanas majoritariamente `PLANNED`). A
estimativa simples já comunica o essencial (ritmo atual vs. carga prevista) sem construir uma
funcionalidade que não teria dado real para operar sobre.

## 2026-07-23 — Busca de anotações via `contains`/`insensitive`, sem `tsvector`

**Decisão**: a busca em `/notes` usa `db.note.findMany` com `contains`/`mode: "insensitive"` do
Prisma (equivalente a `ILIKE`), não `tsvector`/`to_tsquery` do PostgreSQL.
**Motivo**: mesma decisão já registrada para o MVP ("Busca", Fase 1) — `ILIKE` é suficiente para
o volume atual de dados e evita adicionar migrations com índices GIN/`tsvector` antes de haver
necessidade real (poucas anotações por usuário).

<!-- Novas decisões devem ser adicionadas acima desta linha, em ordem cronológica reversa não é
necessária — apenas anexe no final da fase correspondente. -->
