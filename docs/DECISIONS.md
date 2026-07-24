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

## 2026-07-23 — Fase 4: sem `ProjectEvidence`/`SkillEvidence` polimórficas

**Decisão**: `Project`/`Laboratory` têm campos de evidência diretos (`repoUrl`, `deployUrl`,
`evidenceUrl`, `notes`) em vez de uma tabela `ProjectEvidence` genérica com FK polimórfica
(`projectId?`/`laboratoryId?`). Da mesma forma, evidência de competência não é persistida em
uma tabela `SkillEvidence` — é computada por query (`LessonCompletion` via `LessonSkill`) toda
vez que a página de competências é aberta.
**Motivo**: com 1 projeto e 1 laboratório de demonstração, uma tabela polimórfica genérica
adicionaria complexidade (FK opcional dupla, sem constraint de "exatamente uma preenchida" no
nível do banco) sem nenhum ganho real ainda. Entra quando houver múltiplos tipos de evidência
por projeto/laboratório que justifiquem a modelagem genérica.

## 2026-07-23 — Nível de competência: derivado, não uma cache persistida atualizada em lote

**Decisão**: `UserSkillProgress.level` é recalculado e gravado (upsert) apenas para as
competências ligadas à aula recém-concluída, dentro da própria `completeLessonAction` — não há
um job/cron que recalcula tudo periodicamente.
**Motivo**: o gatilho (concluir uma aula) é o único evento que pode mudar o nível hoje (só
`LessonCompletion` conta como evidência); recalcular tudo em lote seria trabalho especulativo
sem outro gatilho que o justifique ainda. Quando projetos/laboratórios também contarem como
evidência de competência (exigiria `ProjectSkill`/`LaboratorySkill`, não criados nesta fase),
o recálculo ganha mais gatilhos, não um job em lote.

## 2026-07-23 — `GitHubProvider`: interface criada, nunca chamada

**Decisão**: `src/modules/portfolio/github-provider.ts` define a interface e uma implementação
`UnconfiguredGitHubProvider` que lança erro ao ser chamada — nenhum código do produto invoca
esse provider; o cadastro de repositório no portfólio é 100% manual (campo de texto).
**Motivo**: exigência explícita do prompt ("estruture uma interface `GitHubProvider` para
integração futura... não torne a integração externa obrigatória"). Implementar a chamada real
à API do GitHub exigiria um token de acesso e rate limiting — fora do escopo do MVP.

## 2026-07-23 — Gamificação: badge "primeira integração com IA" omitido

**Decisão**: o catálogo de 9 badges não inclui "primeira integração com IA" (citado como
exemplo na Etapa 18 do prompt original).
**Motivo**: o tutor de IA é a Fase 5, ainda não implementada — não há nenhum evento real que
possa disparar essa concessão hoje. O badge entra no catálogo junto com a Fase 5, para não ficar
como uma condição morta no código (`checkAndAwardBadges` só concede badges com condição real
verificável).

## 2026-07-23 — AI Labs: sem diagrama Mermaid, timeline em componente próprio

**Decisão**: a linha do tempo de arquitetura em `/ai-labs` é uma lista ordenada estilizada
(componente `MilestoneTimeline`), não um diagrama Mermaid renderizado.
**Motivo**: o prompt cita "diagramas Mermaid" como parte da página da AI Labs, mas isso exigiria
adicionar a biblioteca `mermaid` (ou equivalente) só para esta página — peso extra de bundle
para um único caso de uso que uma lista ordenada já comunica com clareza equivalente. Fica
registrado como possível melhoria visual futura, não uma lacuna funcional.

## 2026-07-23 — Fallback automático para o mock quando `AI_PROVIDER=openai` sem chave

**Decisão**: se `AI_PROVIDER=openai` estiver definido mas `AI_API_KEY` não, o factory
(`getAIProvider()`) usa `MockAIProvider` em vez de lançar erro, registrando um `warn` no logger.
**Motivo**: o limite explícito do prompt diz que o sistema principal deve funcionar sem chave de
IA — um provider mal configurado quebrando a página do tutor violaria isso. Falhar de forma
silenciosa para uma experiência degradada (mas funcional) é mais seguro que expor um erro de
configuração ao estudante.

## 2026-07-23 — Rate limit da IA em memória, não distribuído

**Decisão**: `checkRateLimit()` usa um `Map` em memória do processo Node (15 requisições / 5 min
por usuário), não Redis nem outro store compartilhado.
**Motivo**: suficiente para uma instância única (o modo de deploy do MVP — `docker compose
--profile app up`, sem múltiplas réplicas). Documentado no próprio código que precisa migrar
para um store compartilhado se o app rodar com mais de uma instância em produção.

## 2026-07-23 — Contexto do tutor de IA: só o mínimo, sem perfil persistido

**Decisão**: `buildContextForUser()` monta o contexto (aula atual, aulas concluídas, metas em
aberto, notas recentes) a cada chamada, direto do banco — não existe um "perfil de estudo" ou
memória comportamental persistida entre conversas além do histórico de mensagens em si.
**Motivo**: limite explícito do prompt ("memória comportamental invasiva" e "perfil
psicológico" estão na lista do que não implementar na Etapa 19). O histórico de
`AIConversation`/`AIMessage` existe só para exibição e auditoria, não é usado como entrada para
os providers.

## 2026-07-23 — `MockAIProvider`: heurísticas de texto simples, não um modelo local

**Decisão**: o provider mock usa manipulação de string (dividir em frases, correspondência de
palavras-chave, truncamento) para gerar respostas — não roda nenhum modelo de linguagem local
(ex.: Ollama).
**Motivo**: o objetivo do mock é permitir que o produto funcione e seja demonstrável sem
qualquer dependência externa nem custo computacional relevante; um modelo local adicionaria uma
dependência de infraestrutura pesada (download de pesos, GPU/CPU) desproporcional ao que a
Etapa 19 pede de um "nível 1".

## 2026-07-23 — Auditoria administrativa via log estruturado, sem tabela dedicada

**Decisão**: ações administrativas (`update_week`, `create_lesson`, `add_flashcard`,
`create_project`, `archive_laboratory` etc.) são registradas via
`logger.info("admin_action", { adminId, action, ... })`, não em uma tabela `AuditLog` no banco.
**Motivo**: "auditoria básica" é o requisito explícito (não "trilha de auditoria completa
consultável na UI"); o logger estruturado já existe desde a Fase 1 e os logs de produção
tipicamente vão para um agregador externo (fora do escopo do MVP). Uma tabela dedicada só se
justificaria se a auditoria precisasse ser consultável dentro do próprio produto.

## 2026-07-23 — CRUD administrativo sem drag-and-drop, duplicação ou pré-visualização

**Decisão**: o CRUD de currículo/projetos/laboratórios implementa criar, editar e arquivar
(soft delete via `status = ARCHIVED`), mas não reordenação por arrastar-e-soltar (a ordem de
semanas é fixa pelo `number`; a ordem de aulas usa o campo `order` editável só implicitamente
pela ordem de criação), nem duplicação de conteúdo, nem modo de pré-visualização separado do
conteúdo real.
**Motivo**: o prompt pede para "evitar construir um CMS genérico excessivamente complexo" —
arrastar-soltar, duplicar e pré-visualizar são funcionalidades de conveniência de um CMS maduro,
não essenciais para o MVP administrar o conteúdo que existe hoje (1 programa, poucas aulas/
projetos/laboratórios de demonstração).

## 2026-07-23 — Quiz e flashcards administrados dentro da aula, sem rotas próprias

**Decisão**: não existem `/admin/quizzes` nem `/admin/flashcards` como rotas separadas —
gerenciar essas entidades acontece dentro de `/admin/curriculum/[weekId]`, no editor de cada
aula (`FlashcardManager`/`QuizManager`).
**Motivo**: a lista de rotas da Etapa 24 do prompt original não inclui rotas administrativas
específicas para quiz/flashcards — só `/admin/curriculum`, `/admin/projects`, `/admin/labs` e
`/admin/imports`. Como flashcards e perguntas de quiz sempre pertencem a uma aula, editá-los no
contexto da própria aula é mais direto do que criar telas administrativas isoladas que
exigiriam escolher a aula de novo.

## 2026-07-23 — Headers de segurança básicos, sem CSP completo

**Decisão**: `next.config.ts` define `X-Frame-Options`, `X-Content-Type-Options`,
`Referrer-Policy` e `Permissions-Policy` — não uma Content-Security-Policy completa.
**Motivo**: uma CSP rigorosa exige mapear precisamente todas as origens de script/estilo/
imagem/conexão usadas (Next.js dev overlay, fontes do Google via `next/font`, etc.) e testar
extensivamente para não quebrar a aplicação; o prompt pede "headers de segurança adequados" como
parte de um MVP, não uma auditoria de segurança completa. Os quatro headers implementados cobrem
proteções de alto valor e baixo risco de regressão (clickjacking, MIME sniffing, vazamento de
referrer, APIs de hardware do navegador).

## 2026-07-23 — Reset de senha finalmente implementado (fechando gap da Fase 1)

**Decisão**: `/esqueci-senha` e `/redefinir-senha` foram implementadas na Fase 6, usando o
modelo `PasswordResetToken` que já existia no schema desde a Fase 1 mas nunca tinha sido
utilizado por nenhum código.
**Motivo**: o link "Esqueci minha senha" no formulário de login já apontava para
`/esqueci-senha` desde a Fase 1 (e a rota já estava até liberada como pública em
`src/proxy.ts`), mas a página nunca foi criada — um link morto real, encontrado durante a
verificação de acessibilidade desta fase. Corrigido para não deixar "botões sem funcionamento"
(limite explícito do prompt). Mantém o design já decidido na Fase 1: em desenvolvimento, o link
de redefinição é mostrado na tela (não enviado por e-mail de verdade), já que envio real de
e-mail exige infraestrutura externa fora do escopo do MVP.

## 2026-07-23 — Importação de `Grade_Curricular.md` (grade real, pós-Fase 6)

**Decisão**: além do importador de `Curso.md` (Fase 2), foi criado um segundo importador
(`src/modules/curriculum-import/{grade-parser,grade-distribution}.ts`, função
`importModuleGrid()` em `service.ts`, comando `npm run curriculum:import-grade`) para o arquivo
`Grade_Curricular.md`, criado pelo usuário com os módulos reais da formação (Módulo 0 a 10, mais
IA/RAG/n8n/MCP/OpenCode/Hermes/OpenClaw/Multiagentes/Segurança/Observabilidade/FinOps/SaaS/
Engenharia de Soluções, 24 módulos no total). Ele distribui as 104 semanas já existentes
proporcionalmente ao "peso" de cada módulo (contagem de linhas de tópico, com piso mínimo de 4
para módulos descritos de forma muito resumida como n8n/OpenClaw/SaaS), usando o método dos
maiores restos (Hamilton) para a soma bater exatamente com 104. Atualiza apenas `title` e
`objective` de cada `Week` (o `phaseId`/semestre original não é tocado). O campo
`Week.isManuallyEdited` (ver decisão abaixo) foi adicionado exatamente para este caso: proteger
semanas editadas manualmente pelo CRUD administrativo contra reimportação.
**Motivo**: instrução explícita do usuário — `Curso.md` (Fase 2) descrevia a formação em prosa
genérica; `Grade_Curricular.md` é a grade curricular real e detalhada, e deveria substituir os
títulos placeholder ("Semana N — a definir") sem recriar a estrutura de 104 semanas nem duplicar
o importador existente.

## 2026-07-23 — AI Labs vs. APEX Academy: entidades separadas; Projeto Final vira `Project`

**Decisão**: "AI Labs" (empresa fictícia cuja infraestrutura evolui ao longo da formação — ver
seção 9 de `docs/DATA_MODEL.md`, `Department`/`ArchitectureMilestone`) e "APEX Academy" (o
produto SaaS educacional que o aluno constrói como projeto de encerramento, descrito no bloco
"🏆 PROJETO FINAL" de `Grade_Curricular.md`) são mantidas como conceitos distintos — nenhum nome
substitui o outro em nenhuma entidade existente. O Projeto Final não ganhou um domínio/tabela
nova: `importModuleGrid()` cria (idempotente, por título) um único `Project` chamado
`"Projeto Final: APEX Academy"`, com os 29 componentes listados no arquivo como
`deliverables[]`, reaproveitando o modelo `Project` já existente desde a Fase 4.
**Motivo**: instrução explícita do usuário para não confundir as duas entidades e para reaproveitar
o modelo de dados existente (`Project`/`Laboratory`) em vez de criar um novo domínio só para o
projeto final.

## 2026-07-23 — `Week.isManuallyEdited` finalmente adicionado ao schema

**Decisão**: o campo `isManuallyEdited Boolean @default(false)` (descrito desde a Fase 2 em
`docs/CURRICULUM_IMPORT.md`, mas adiado — ver decisão "`isManuallyEdited` da importação adiado"
acima) foi adicionado ao modelo `Week` nesta sessão. `updateWeekAction` (CRUD administrativo,
`src/modules/admin-curriculum/actions.ts`) agora grava `isManuallyEdited: true` a cada edição
salva pelo admin; `importModuleGrid()` pula (não sobrescreve) qualquer semana com esse campo
`true`, apenas contando-a como "preservada" no relatório.
**Motivo**: a precondição registrada na Fase 2 (CRUD administrativo existir) só se tornou
verdadeira na Fase 6; a necessidade real surgiu agora, com a reimportação da grade curricular
tendo que conviver com possíveis edições manuais futuras sem sobrescrevê-las.

## 2026-07-23 — Heurística de peso do módulo: linhas sem ponto final = tópico

**Decisão**: `countTopicWeight()` em `grade-parser.ts` conta como "tópico" (peso do módulo)
qualquer linha do bloco do módulo que não termine em "." e não seja um rótulo conhecido
(`Disciplinas`/`Objetivo`/`Projeto`), com piso mínimo de 4 tópicos por módulo. Módulos com
descrição muito resumida em prosa (ex.: "n8n — Tudo.", "SaaS — Todo conhecimento reunido.") caem
no piso mínimo em vez de peso zero.
**Motivo**: `Grade_Curricular.md` não tem uma marcação explícita de "peso"/duração por módulo;
frases de prosa (que terminam em ponto) descrevem objetivos/projetos, enquanto listas de
tecnologias/tópicos (que não terminam em ponto) são o sinal mais confiável e simples disponível
no texto para aproximar o tamanho relativo de cada módulo, sem inventar uma métrica externa ao
arquivo-fonte.

## 2026-07-23 — "Engenharia de Soluções" incorporada como módulo formal no arquivo-fonte

**Decisão**: o texto original de `Grade_Curricular.md` mencionava "Engenharia de Soluções" como
uma disciplina adicional em prosa solta, fora do padrão de cabeçalho `🟦 MÓDULO N — Nome` usado
pelos demais módulos (e também fora da área varrida pelo parser, que para no cabeçalho "🏆
PROJETO FINAL"). A pedido do usuário, o arquivo foi editado para incluir um cabeçalho de módulo
formal (`🟪 Engenharia de Soluções`, com disciplinas e projeto) antes do bloco do Projeto Final,
e o texto duplicado ao final do arquivo foi resumido para não repetir o mesmo conteúdo em prosa.
**Motivo**: manter o parser simples e sem casos especiais (nenhuma exceção de parsing para texto
fora do padrão) — a estrutura correta é editar o arquivo-fonte para seguir o mesmo padrão que
todos os outros módulos, não ensinar o parser a reconhecer um formato solto único.

## 2026-07-23 — `status` esquecido na primeira versão de `importModuleGrid` (bug real, corrigido)

**Decisão/observação**: a primeira versão de `importModuleGrid()` atualizava apenas `title` e
`objective` da `Week`, deixando `status = PLANNED`. Isso fazia o roadmap continuar mostrando o
card "conteúdo detalhado ainda não definido" mesmo em semanas com título real, porque toda a UI
usa `status !== "PLANNED"` como sinal de "semana tem conteúdo" (mesma convenção já usada pela
Semana 0). Encontrado ao conferir a página `/roadmap` ao vivo no navegador logo após a primeira
importação. Corrigido para gravar `status: "AVAILABLE"` junto com `title`/`objective` (semanas
`isManuallyEdited` continuam puladas), e a importação foi reexecutada com `--force` (hash do
arquivo não mudou) para aplicar a correção às 104 semanas já importadas.
**Motivo**: a instrução original do usuário já pedia atualizar "título e status"; a omissão foi
um erro de implementação, não uma decisão de escopo.

## 2026-07-23 — Geração de 1 aula real por semana (`importGradeLessons`)

**Decisão**: além de `importModuleGrid` (que só atualiza `title`/`objective`/`status` da
`Week`), foi criado `importGradeLessons()` (`grade-lessons.ts` + nova função em `service.ts`,
comando `npm run curriculum:import-lessons`), que gera **1 `Lesson` real por semana** (104 no
total, além das 2 aulas de demonstração da Semana 0 já existentes). Os tópicos de cada módulo
(já extraídos por `grade-parser.ts` para calcular o peso) são divididos em fatias contíguas entre
as semanas do módulo (mesma ordem do arquivo-fonte); a última semana de cada módulo também recebe
a descrição do projeto do módulo. Cada aula segue uma estrutura fixa e completa (objetivo,
tópicos da semana, "como estudar", laboratório guiado, exercícios, "como a AI Labs faria",
projeto do módulo quando aplicável, checklist) — inspirada literalmente na lista "Cada dia de
estudo terá" descrita pelo usuário no fim de `Grade_Curricular.md`. Módulos com descrição muito
resumida no arquivo-fonte (n8n, SaaS — nenhuma linha de tópico real) usam o próprio nome do
módulo como conteúdo de estudo da semana, para o checklist nunca ficar vazio.
**Motivo**: o usuário reportou que o Dashboard/`/learn` só mostrava as 2 aulas de demonstração —
a importação da grade (`importModuleGrid`) só populava `Week`, não `Lesson`, então não havia
nenhuma aula real vinculada aos módulos importados. Optou-se por gerar uma estrutura pedagógica
completa e reaproveitável (não apenas um stub vazio) diretamente dos dados já extraídos do
arquivo-fonte, deixando claro no rodapé de cada aula que explicações mais aprofundadas por tópico
podem ser adicionadas/editadas pela área administrativa a qualquer momento — não se tentou gerar
conteúdo didático extenso e único para cada uma das 104 semanas manualmente, o que seria
inviável de produzir com profundidade e precisão técnica real em uma única sessão.
**Idempotência**: mesmo padrão de `ImportJob.contentHash`, com `sourceFile` distinto
(`"Grade_Curricular.md#lessons"`) do usado por `importModuleGrid`, para os dois relatórios de
importação não colidirem; dentro de uma execução forçada, semanas que já têm uma aula não-demo
são puladas (nunca duplicadas nem sobrescritas).

## 2026-07-23 — Etapa 1 (pós-Fase 6): AI Gateway multi-provider

**Decisão**: o factory de provider único (`factory.ts`, `getAIProvider()`, env `AI_PROVIDER`)
foi substituído por um **AI Gateway** (`gateway.ts`, `getProviderForTask(taskType)`) que roteia
entre `OpenAIProvider`, `ClaudeProvider` (novo), `GeminiProvider` (novo) e `MockAIProvider` com
base em uma regra fixa por tipo de tarefa (`AITaskType`): `TEACH` (perguntas, explicações, quiz,
sugestão) → OpenAI ou Claude, configurável via `AI_TEACHING_PROVIDER` (padrão OpenAI);
`CODE_REVIEW` → sempre Claude (usado a partir da Etapa 6); `SUMMARIZE` → sempre Gemini. Cada
provider real só é instanciado se sua chave (`AI_OPENAI_API_KEY`/`AI_CLAUDE_API_KEY`/
`AI_GEMINI_API_KEY`) estiver configurada; caso contrário o Gateway cai automaticamente para o
Mock (mesmo comportamento já validado na Fase 5, agora por provider individual em vez de global).
Env vars renomeadas: `AI_API_KEY`/`AI_MODEL` (só OpenAI) → `AI_OPENAI_API_KEY`/`AI_OPENAI_MODEL`;
`AI_PROVIDER` removida (não faz mais sentido escolher "o" provider global — a escolha agora é por
tarefa). `AIMessage.provider` (já existente desde a Fase 5) continua registrando qual provider
respondeu cada interação, agora podendo ser `openai`, `claude`, `gemini` ou `mock`.
**Motivo**: instrução explícita do usuário para uma arquitetura multi-provider com roteamento
determinístico por tipo de tarefa (não uma IA decidindo por outra IA), mantendo todos os limites
de segurança já estabelecidos na Fase 5 (chamadas só no servidor, fallback sem quebrar o sistema,
aviso de que respostas podem conter erros).
**Ollama**: propositalmente **não** implementado nesta etapa (instrução explícita do usuário, por
custo de performance na máquina local do aluno) — a interface `AIProvider` já é genérica o
suficiente para receber um `OllamaProvider` no futuro sem mudar o Gateway.

## 2026-07-23 — Etapa 2: Personas do Mentor de IA

**Decisão**: adicionado `converse()` à interface `AIProvider` (implementado pelos 4 adapters) e
um módulo `personas.ts` com 5 personas (`AIPersona`: `PROFESSOR`, `TECH_LEAD`, `ARQUITETO`,
`ENTREVISTADOR`, `CLIENTE`), cada uma só um prompt de sistema especializado
(`buildPersonaSystemPrompt`) — não são agentes independentes nem multiagentes de verdade. O
aluno escolhe a persona em um seletor na nova aba "Conversar com uma persona" do Tutor de IA,
antes de enviar a mensagem. `getProviderForPersona()` (`gateway.ts`) reaproveita o roteamento por
tarefa da Etapa 1: `TECH_LEAD` → `CODE_REVIEW` (Claude); as demais 4 → `TEACH` (OpenAI/Claude,
conforme `AI_TEACHING_PROVIDER`). `MockAIProvider.converse()` dá uma resposta heurística
diferente por persona (nunca uma simulação real de raciocínio), sempre identificada como
resposta do provider mock.
**Motivo**: instrução explícita do usuário — personas como troca de contexto/instrução roteada
pelo Gateway já existente, sem introduzir orquestração de agentes (isso fica para quando o aluno
já tiver estudado n8n/MCP/agentes, fase futura). Reaproveitar o roteamento por tarefa da Etapa 1
em vez de criar um novo mecanismo de seleção de provider evita duplicar lógica.
**Nota de escopo**: a persona Tech Lead aqui é só a conversa (com nota heurística de exemplo); o
fluxo real de revisão de código vinculado a um projeto, com histórico persistido, é a Etapa 6. A
persona Arquiteto aqui também é só conversa; a tela dedicada com diagrama Mermaid é a Etapa 7.

## 2026-07-23 — Etapa 3: geração e persistência do conteúdo das aulas via IA

**Decisão**: adicionados `Lesson.isManuallyEdited` (mesma semântica de `Week.isManuallyEdited`,
gravado `true` por `saveLessonAction` a cada edição manual do admin) e `Lesson.aiGeneratedAt`
(nullable; gravado quando a IA gera conteúdo). Nova action `generateLessonContentAction(lessonId,
confirmOverwrite?)`: usa a persona Professor via `getProviderForPersona("PROFESSOR")`, envia o
conteúdo-base atual da aula (tópicos/checklist já existentes, criados pela importação da grade)
como contexto, e pede uma reescrita completa e aprofundada — objetivo, explicação de cada
conceito, analogias, seção 80/20, exemplos práticos, checklist de laboratório guiado e
exercícios — mantendo os mesmos tópicos reais (sem inventar tecnologia fora do conteúdo-base).
O resultado é salvo com `status = DRAFT` e nunca fica visível em `/learn` automaticamente
(`getLessonsForLearnPage` já filtra por `status = AVAILABLE`). Nova action
`approveLessonContentAction(lessonId)`: DRAFT → AVAILABLE, a única forma de publicar. Se
`lesson.isManuallyEdited` for `true`, a geração exige `confirmOverwrite: true` explícito (a UI
usa `window.confirm` — simples e suficiente para uma ação só de admin); sem essa confirmação, a
action recusa e não sobrescreve nada.
**Disparo**: **manual, via botão "Gerar conteúdo com IA"** em `/admin/curriculum/[weekId]` — não
automático na primeira visita do estudante. Decisão explícita entre as duas opções oferecidas
pelo prompt original.
**Motivo do disparo manual**: (1) geração automática na primeira visita colocaria uma chamada de
IA síncrona no carregamento da página do estudante (latência ruim, e com o Mock como padrão de
fábrica seria uma chamada sem valor real); (2) um Server Component não deveria ter esse tipo de
efeito colateral em uma requisição de leitura; (3) o botão manual já garante que um humano está
"no circuito" no momento da geração, reforçando (não substituindo) a revisão via `DRAFT`.
**Guarda contra regressão de qualidade com o Mock**: se `getProviderForPersona("PROFESSOR")`
resolver para o Mock (nenhuma chave real configurada), a action **recusa** gerar em vez de
substituir o conteúdo estruturado já existente (tópicos reais + checklist, da Etapa de
importação da grade) por um resumo genérico de 3 frases do `MockAIProvider.converse` — isso
seria uma regressão de qualidade, não uma geração de conteúdo. Mensagem explícita orienta a
configurar `AI_OPENAI_API_KEY` ou `AI_CLAUDE_API_KEY`.
**UI**: banner "conteúdo gerado por IA, aguardando revisão" tanto no editor administrativo
(com botão "Aprovar e publicar") quanto na página pública da aula (`/learn/[lessonId]`), caso um
estudante acesse uma aula em `DRAFT` por link direto — nunca apresentado como conteúdo oficial
sem o aviso.

## 2026-07-23 — Etapa 4: Trilha "Produto" reaproveitando `ArchitectureMilestone`

**Decisão**: em vez de criar uma tabela nova para a Trilha Produto, `ArchitectureMilestone`
(já existente desde a Fase 4 para a linha do tempo da AI Labs) ganhou um campo
`track: MilestoneTrack` (`AI_LABS | PRODUCT`, padrão `AI_LABS` — preserva as 24 linhas
existentes sem migração de dados) e um `weekId String? @unique` opcional (1 marco de produto por
semana, no máximo). A restrição única de `order` mudou de global para `@@unique([track, order])`,
já que agora duas "linhas do tempo" independentes compartilham a mesma tabela. Todas as queries
que já liam `ArchitectureMilestone` para a AI Labs (`getArchitectureMilestones`,
`toggleMilestoneAchievedAction`) foram atualizadas para filtrar `track: "AI_LABS"` — nunca
misturam com marcos de produto.
**Motivo**: instrução explícita do usuário para reaproveitar `Project`/`Laboratory`/
`ArchitectureMilestone` em vez de criar um novo domínio; `ArchitectureMilestone` já tinha a forma
certa (`order`, `status`, marco único) para representar uma linha do tempo, só faltava
distinguir a qual trilha cada marco pertence e vinculá-lo opcionalmente a uma semana.
**Sem geração em massa**: ao contrário da importação da grade (que criou as 104 `Week` de uma
vez), **nenhum marco de produto é pré-criado** — a tabela fica esparsa (só existe uma linha
quando um admin realmente define o marco daquela semana). Semanas sem marco aparecem como "a
definir" computado na UI, não como uma linha vazia no banco. Isso evita criar 104 registros sem
nenhum conteúdo real (a Trilha Produto não tem nenhuma fonte de dados em `Curso.md`/
`Grade_Curricular.md` — é inteiramente definida pela área administrativa ao longo do tempo).
**UI**: `/roadmap` ganhou um seletor de trilha (Formação/Produto) que reaproveita a mesma
estrutura de lista/timeline/mapa já existente, só trocando o campo exibido por semana (título e
status próprios da `Week`, ou título/status do `productMilestone` vinculado). `/roadmap/[weekId]`
mostra um card fixo da Trilha Produto (marco vinculado, ou "a definir"). Edição fica em
`/admin/curriculum/[weekId]` (novo componente `ProductMilestoneForm`, upsert por `weekId`).

## 2026-07-23 — Etapa 5: estatísticas reais no dashboard

**Decisão**: o Dashboard passou de 3 para 6 cartões de métrica, todos vindos de tabelas reais já
existentes: horas estudadas e sequência de estudo (já existiam, apenas reordenadas para o topo —
"exibir de forma mais proeminente"); aulas concluídas (já existia); **projetos concluídos**
(`ProjectSubmission.count({ status: "DONE" })`, novo); **commits registrados**
(`Profile.manualCommitCount`, novo campo — editável inline pelo próprio estudante via
`updateManualCommitCountAction`); **domínio por tecnologia** (média de
`SKILL_LEVEL_PROGRESS[level]`, já usado em `/skills`, sobre todas as `Skill` existentes — trata
competências nunca iniciadas como 0%, não as ignora). Nenhum número é inventado ou hardcoded.
**"Commits registrados" é manual**: a integração real com GitHub (`GitHubProvider`, Fase 4) segue
sem implementação (interface pronta, nunca chamada); pedir ao estudante para digitar sua
contagem de commits é a opção mais simples que atende ao requisito sem exigir OAuth/token do
GitHub.
**Limpeza correlata**: o cartão "Próximas entregas" ainda listava a Fase 5 (Tutor de IA) e a Fase
6 (administração) como pendentes — ambas já estavam concluídas há muito. Atualizado para listar
as próximas etapas reais desta sessão (Etapa 6: code review por IA; Etapa 8: certificação), já
que o cartão estava sendo tocado de qualquer forma nesta etapa.

## 2026-07-23 — Etapa 6: Code Review com nota via IA

**Decisão**: novo modelo `CodeReview` (submissionId, score? Float, feedback, provider,
createdAt), vinculado a `ProjectSubmission`. `requestCodeReviewAction(projectId)` exige que a
submissão já tenha `repoUrl` preenchido, chama `getProviderForPersona("TECH_LEAD")` (reaproveita
o roteamento da Etapa 1/2 — Claude, ou Mock sem chave) e cria uma nova linha em `CodeReview` a
cada solicitação (histórico completo, nunca sobrescrito). O `score` é extraído por regex
(`/nota:?\s*(\d{1,2}(?:[.,]\d)?)/i`) da resposta em texto livre da persona — fica `null` se a IA
não seguir o formato pedido, em vez de travar a revisão. Rate limit dedicado (5 revisões / 10 min
por usuário) reaproveita `checkRateLimit` genérico.
**Sem leitura real do código**: como a integração real com GitHub segue não implementada
(`GitHubProvider`, Fase 4, interface pronta mas nunca chamada — buscar o conteúdo real de um
repositório exigiria token de acesso e rate limit da API do GitHub, fora do escopo), a revisão é
baseada nas informações que o estudante já forneceu (URL do repositório, decisões técnicas,
retrospectiva) e nos requisitos do projeto — **não** em uma leitura linha a linha do código. Isso
é comunicado explicitamente na UI (`CodeReviewPanel`), junto com o aviso de que é uma "avaliação
assistida por IA, não uma nota oficial" (exigência explícita do usuário).
**Por que não extrair a nota em JSON estruturado**: a Etapa 2 já usa `converse()` com resposta em
texto livre para todas as personas; pedir um formato estruturado (JSON) só para o Tech Lead
exigiria um método novo na interface `AIProvider` (`reviewCode`) implementado nos 4 adapters só
para este caso. Regex simples sobre uma instrução de formato explícita no prompt ("comece com a
linha 'Nota: X.X'") é suficiente e mais simples, com um fallback seguro (`score = null`) se
falhar.

## 2026-07-23 — Etapa 7: IA de Arquitetura (persona Arquiteto)

**Decisão**: nova página `/architecture` (módulo `architecture-advisor`, sem tabela nova no
banco — é uma ferramenta de exploração pontual, sem histórico persistido, ao contrário da Etapa
6 que explicitamente pedia salvar histórico). O aluno descreve um problema em texto livre;
`requestArchitectureSuggestionAction` chama a persona Arquiteto (Gateway → TEACH, já que não há
uma regra de roteamento específica de "arquitetura" definida na Etapa 1 — usa o mesmo caminho de
OpenAI/Claude/Mock do ensino) pedindo explicitamente o formato
`"- **Nome do componente**: justificativa"`, uma linha por componente, sem texto antes/depois.
`parseArchitectureComponents()` extrai essa lista por regex; se a IA não seguir o formato, a UI
cai para mostrar o texto bruto (nunca falha silenciosamente).
**Sem Mermaid**: o "diagrama" é uma lista de cartões conectados por setas (mesmo padrão já usado
em `MilestoneTimeline` da AI Labs) — decisão consistente com a já registrada para a AI Labs
("sem diagrama Mermaid, timeline em componente próprio"): adicionar a biblioteca `mermaid` só
para uma tela pesaria no bundle sem necessidade real, já que uma lista conectada comunica a
mesma informação (componentes + ordem/relação) com clareza equivalente.
**MockAIProvider.converse (persona ARQUITETO)** foi ajustado para responder no mesmo formato
parseável (Etapa 2 usava um texto livre não estruturado) — assim a funcionalidade continua
minimamente útil mesmo sem nenhuma chave de IA configurada, e não fica "quebrada" no caminho
padrão de fábrica.
**Tratamento como sugestão, nunca decisão aplicada**: nenhuma ação da IA aqui persiste nada além
do rate limit em memória; a resposta é puramente exibida para avaliação humana, conforme
exigência explícita do usuário.

## 2026-07-23 — Etapa 8: certificação interna por semestre

**Correção de premissa**: o prompt desta etapa afirmava que "`Certification` existe no schema,
mas sem fluxo" — isso **não era verdade** neste projeto: nenhum modelo `Certification` havia
sido criado em nenhuma fase anterior (só citado como aspiração em `docs/PRODUCT_SPEC.md`,
"certificações internas nomeadas"). Não era um bloqueio real — a etapa foi executada criando o
modelo do zero, já que a intenção (completar o fluxo de certificação) estava clara.
**Decisão**: novo modelo `Certification` (userId, phaseId, code único, issuedAt —
`@@unique([userId, phaseId])`, emitido uma vez por semestre por usuário). Os 3 requisitos do
prompt ("todas as semanas obrigatórias" + "um projeto final do semestre" + "uma avaliação") não
tinham vínculo direto com `Phase` no schema existente (`Project`/`Assessment` são entidades
soltas, sem `phaseId`) — resolvido com o mesmo padrão já usado na Etapa 4 (Trilha Produto):
`Phase.finalProjectId`/`finalAssessmentId`, FKs opcionais e únicas, definidas pela área
administrativa (`/admin/curriculum`, novo `PhaseRequirementsForm`) — sparse, sem inventar qual
projeto/avaliação "é" o final de cada semestre. Se o admin não definir, o requisito
correspondente nunca é satisfeito (mensagem explícita ao estudante: "ainda não definido pela
área administrativa"), em vez de assumir um projeto/avaliação qualquer.
**Requisito "semanas concluídas"**: como cada semana tem exatamente 1 `Lesson` real (Etapa 3),
"semana concluída" = `LessonCompletion` para essa aula; só conta aulas com `status = AVAILABLE`
(aulas ainda em `DRAFT`/`PLANNED` não são exigíveis). "Avaliação respondida" exige apenas 1
`AssessmentAttempt` com `submittedAt` preenchido — não foi definida uma nota mínima de
aprovação (não pedida explicitamente, e introduziria uma configuração extra sem necessidade
comprovada).
**Verificação ao vivo**: como não havia estudante real com um semestre inteiro concluído, os
pré-requisitos foram forçados temporariamente via script (18 aulas do Semestre 1 marcadas
concluídas, submissão do projeto demo marcada `DONE`, uma tentativa de avaliação criada) só para
confirmar o fluxo ponta a ponta (elegibilidade → emissão → página de visualização) e depois
revertidos — nenhum dado de teste permanente ficou no banco.

## 2026-07-23 — Correções reais no `ClaudeProvider` após a primeira chave real configurada

Ao configurar chaves reais de Claude/Gemini pela primeira vez, três bugs reais foram encontrados
e corrigidos (nenhum era fallback silencioso para o mock — o Gateway sempre detectou a chave
corretamente; os erros abaixo eram na chamada real à API):

1. **Modelo inexistente**: `AI_CLAUDE_MODEL` (padrão de fábrica) apontava para
   `claude-3-5-sonnet-latest`, que a API da Anthropic retornou como `not_found_error` (404).
   **Corrigido** para `claude-sonnet-5` (`.env`, `.env.example`,
   `src/modules/artificial-intelligence/claude-provider.ts`).
2. **Parsing de resposta frágil**: `callMessages()` assumia que o texto da resposta estava
   sempre em `data.content[0].text`. Com um bloco de "thinking" (raciocínio interno) antes do
   bloco de texto — comum em modelos mais novos —, isso falhava com "Resposta inesperada do
   provider de IA". **Corrigido** para procurar o primeiro bloco `type: "text"` em vez de
   assumir o índice 0, com log do corpo bruto da resposta em caso de falha (mais fácil de
   depurar no futuro).
3. **`max_tokens` baixo demais para geração de aula completa**: o valor herdado das respostas
   curtas do tutor (700, depois 4096) truncava o conteúdo gerado pela Etapa 3 no meio de uma
   frase. **Corrigido** para 16000 — conteúdo de aula completo (7 seções, exemplos de código,
   exercícios) cabe sem cortes; chamadas curtas continuam rápidas (o modelo não "enche" a
   resposta só porque o teto é mais alto).

Também corrigido um erro de digitação do usuário no `.env`: o texto `npm run dev` havia sido
colado sem querer ao final da chave `AI_GEMINI_API_KEY`, corrompendo-a — removido.

## 2026-07-23 — Reforço da persona Professor contra conteúdo genérico ("vá pesquisar a documentação")

**Problema relatado**: o conteúdo gerado (antes das correções acima) era raso, com frases como
"leia a documentação oficial" no lugar de uma explicação real — mas essa amostra específica
("Semana 6") nunca tinha sido gerada por IA com sucesso ainda (só o template da importação da
grade, que usa essa linguagem por design, já que é apenas um esqueleto — ver a decisão da
Etapa "geração de aulas" — mais a tentativa que falhou por causa do bug #1 acima). Ainda assim,
o risco de a persona Professor produzir esse tipo de resposta genérica era real e foi reforçado
preventivamente.
**Decisão**: `PERSONA_INSTRUCTIONS.PROFESSOR` (`personas.ts`) e
`buildLessonGenerationMessage()` (`admin-curriculum/actions.ts`) foram reescritos com
instruções explícitas e negativas: proibido responder só mandando o estudante "pesquisar a
documentação oficial"/"testar por conta própria" como se isso fosse o conteúdo; a IA deve ela
mesma ensinar cada conceito, com ordem obrigatória (objetivo → explicação completa →
analogias → 80/20 → exemplos reais de código/comandos → só então laboratório/exercícios).
**Verificado ao vivo**: regenerada a Semana 6 com Claude real após as correções — resultado com
~28 mil caracteres, 7 seções completas, explicação técnica real (transformers, RLHF,
Constitutional AI), 5 analogias, seção 80/20 explícita, exemplos reais de código (`curl`,
Python, JSON de configuração), checklist de laboratório e 5 exercícios variados — mostrado ao
usuário para aprovação manual (status permanece `DRAFT` até `approveLessonContentAction`).

## 2026-07-23 — "Pergunte ao Professor" ao final de cada aula

**Decisão**: `/learn/[lessonId]` ganhou um card fixo ao final do conteúdo, "Pergunte ao
Professor", com um link para `/ai-tutor?lessonId=<id>`. `/ai-tutor` passou a aceitar
`?lessonId=` via `searchParams` e repassa como `initialLessonId` para `AiTutorPanel`, que usa
esse valor para pré-selecionar o contexto de aula na aba "Conversar com uma persona" (Professor
já é a persona padrão dessa aba desde a Etapa 2). Resultado: 1 clique leva direto para uma
conversa com o Professor já contextualizada na aula que o estudante estava lendo.
**Motivo**: instrução explícita do usuário. Reaproveita 100% a infraestrutura de personas já
existente (Etapa 2) — nenhuma lógica de IA nova, só encadeamento de navegação + estado inicial.

## 2026-07-23 — "Pergunte ao Professor" vira um diálogo inline (não navega mais para `/ai-tutor`)

**Decisão**: a versão inicial do card "Pergunte ao Professor" em `/learn/[lessonId]` linkava
para `/ai-tutor?lessonId=...`. A pedido explícito do usuário ("uma caixa se abre ali mesmo
naquela página"), virou um componente cliente (`AskProfessorDialog`) que abre um `Dialog`
(shadcn/radix) na própria página da aula — textarea + botão "Perguntar" chamando
`converseAction({ persona: "PROFESSOR", message, lessonId })` diretamente, exibindo a resposta
renderizada em Markdown dentro do próprio diálogo. Não navega para `/ai-tutor` mais; o campo
`?lessonId=` em `/ai-tutor` (Etapa anterior) continua existindo e funcionando para quem chega
por lá diretamente, só deixou de ser o caminho usado a partir da página da aula.
**Motivo**: instrução explícita do usuário. Reaproveita 100% a action e a persona já existentes
(Etapa 2) — só muda a superfície de UI (diálogo em vez de navegação de página inteira).

## 2026-07-23 — Unidade de conteúdo passa a ser o dia, não a semana

**Decisão**: a pedido explícito do usuário ("vamos trabalhar por conteúdo, não de semanas"),
`Lesson` passou a ter, tipicamente, `Program.weeklyDays` (5) linhas por semana em vez de 1 —
reaproveitando o mesmo modelo `Lesson` já existente (`order` já suportava múltiplas aulas por
semana desde a Fase 2; nenhuma migração de schema foi necessária). Nova função
`buildDailyLessons()` (`grade-lessons.ts`) reaplica o utilitário `chunkTopics()` duas vezes: uma
para dividir os tópicos do módulo entre as semanas (como já fazia `buildWeekLessons`), outra para
dividir os tópicos de cada semana entre os dias. Nova função de serviço
`importGradeDailyLessons({ rawContent, weekNumbers })` (`service.ts`) — diferente de
`importGradeLessons`, que só cria quando a semana ainda não tem aula, esta **substitui**
(`deleteMany` + recriação) as aulas de cada semana informada, pulando (preservando) qualquer
semana com alguma aula `isManuallyEdited`. Não é uma migração automática de todas as 104 semanas
— é invocada explicitamente por lista de números de semana, começando pelo módulo Preparação
(1–7), a pedido do usuário. As demais 97 semanas continuam com 1 aula/semana até serem
regeneradas da mesma forma quando o respectivo módulo for trabalhado.
**Duração por aula**: mudou de `weeklyDays * dailyHours * 60` (a carga da semana inteira,
inadequada agora que cada aula é 1 dia) para `dailyHours * 60` (~210 min, a carga de 1 dia).
**Bug real encontrado e corrigido antes da geração por IA**: a primeira versão de
`buildDayContentMarkdown` usava `module.topics` (todos os ~15 tópicos do módulo inteiro) como
fallback para "dias de consolidação" (quando uma semana com poucos tópicos reais — ex.: 2 para
"VS Code, Windows Terminal" — não tem tópico novo para preencher os 5 dias). Isso fazia 3 dos 5
dias de cada semana mostrarem a lista completa do módulo, não da semana. Corrigido para cair
primeiro nos tópicos da própria semana (`weekTopics`), só recorrendo ao módulo inteiro se a
semana não tiver nenhum tópico real.
**UI**: nenhuma mudança de página foi necessária além da geração de conteúdo —
`/roadmap/[weekId]`, `/learn` e `/admin/curriculum/[weekId]` já iteravam `week.lessons` (uma
lista) desde que o modelo `Lesson` existe, então múltiplas aulas por semana já eram exibidas
corretamente sem nenhum ajuste de template.
**Verificação**: template gerado para as 7 semanas de Preparação (35 aulas), cada uma
individualmente aprofundada pela persona Professor (mesmo processo da Etapa 3, aplicado a cada
uma das 35 aulas em vez de 1 por semana), revisadas antes de aprovar.

## 2026-07-23 — Laboratórios vinculados à aula que os originou

**Decisão**: `Laboratory` ganhou `lessonId` opcional (FK simples, não única — uma aula pode, em
tese, ter mais de um laboratório) e o mesmo par `isManuallyEdited`/`aiGeneratedAt` já usado em
`Week`/`Lesson`. Toda superfície de UI que lista um laboratório agora mostra explicitamente a
qual aula/semana ele se refere ("Referente à Semana N: <aula>") — `/labs`, `/labs/[labId]`
(com link de volta para `/learn/[lessonId]`) e `/admin/labs`. Geração por IA
(`generateLabContentAction`, `src/modules/laboratories/actions.ts`) reaproveita a persona
Professor e o mesmo padrão de aprovação da Etapa 3 (salva `DRAFT`, recusa se só o Mock estiver
disponível, exige confirmação para sobrescrever edição manual). O botão "Gerar laboratório com
IA" fica dentro do próprio editor da aula (`/admin/curriculum/[weekId]`, novo
`LessonLabPanel`) — não numa tela separada — porque o laboratório nasce a partir do contexto de
uma aula específica, reforçando o vínculo.
**Conteúdo como um blob rico, não campos fragmentados**: em vez de pedir à IA um objeto
estruturado com 7 campos separados (objective/environment/instructions/commands/...), o gerador
pede **um único documento Markdown com passo a passo numerado** (comandos reais, resultado
esperado por passo), salvo inteiro em `instructions` — mesma filosofia já usada para o conteúdo
de aula (Etapa 3) e para a arquitetura sugerida (Etapa 7): um blob coeso é mais simples de gerar
e mais fácil de revisar do que tentar fatiar a resposta da IA em múltiplos campos de banco. A
página de laboratório passou a renderizar `instructions` com o componente `<Markdown>` (antes
era texto puro em `<pre>`); os campos antigos (`environment`/`commands`/etc.) continuam existindo
no schema e na UI para labs criados manualmente, só ficam vazios nos gerados por IA.
**Bug de infraestrutura encontrado durante a implementação**: a migration desse recurso
(`laboratory_lesson_link`) foi aplicada com o servidor de desenvolvimento já rodando, e o
Prisma Client em memória do processo não pegou o campo novo automaticamente — o mesmo problema
já visto nas Etapas 4 e 8 (a correção é sempre reiniciar `next dev` depois de qualquer migration,
nunca assumir que o Turbopack detecta a mudança sozinho). Isso interrompeu no meio um lote de
geração de conteúdo de aula em segundo plano (módulo Fundamentos da Computação) que estava
rodando contra o mesmo servidor — o lote foi retomado do ponto exato em que parou depois do
reinício, sem perda de nenhuma aula já gerada.

## 2026-07-23 — Bug real: as 35 aulas diárias de Preparação ficaram em DRAFT sem aprovação

**O que aconteceu**: ao regenerar Preparação do formato semanal (1 aula/semana, já aprovada) para
o formato diário (5 aulas/semana), a regeneração recria as aulas do zero — o aprofundamento por
IA (`generateLessonContentAction`) sempre grava `status = DRAFT`, corretamente. O usuário
confirmou a aprovação do conteúdo revisado, mas a ação de aprovar (`approveLessonContentAction`)
nunca foi de fato executada para essas 35 aulas novas antes de seguir para a próxima tarefa —
diferente do módulo Fundamentos da Computação (semanas 8–19), onde a aprovação em lote foi
explicitamente rodada depois da revisão. Resultado: as semanas 1–7 sumiram de `/learn` (a
consulta já filtra por `status = "AVAILABLE"`, como esperado — não era um bug na query, era
conteúdo genuinamente não aprovado ainda).
**Correção**: as 35 aulas foram aprovadas (`status = AVAILABLE`); confirmado por varredura
completa que **nenhuma** aula no banco ficou presa em `DRAFT` depois disso.
**Lição registrada**: sempre que uma regeneração de conteúdo (template → aprofundamento por IA)
terminar, rodar explicitamente a aprovação em lote como parte do mesmo fluxo de trabalho — não
tratar "aprovar o conteúdo" (confirmação do usuário) como equivalente a "já rodei a ação de
aprovação no sistema".

## 2026-07-24 — Perguntas ao Professor ficam salvas e visíveis para outros alunos

**Decisão**: nova tabela `LessonQuestion` (`lessonId`, `userId`, `question`, `answer`, `provider`,
`createdAt`) grava cada par pergunta/resposta feito no diálogo "Pergunte ao Professor". Nova
Server Action `askProfessorAction` (em vez do `converseAction` genérico) faz a chamada à IA e
persiste o registro. A página da aula (`/learn/[lessonId]`) passa a listar, abaixo do card de
pergunta, todas as perguntas já feitas por qualquer aluno naquela aula (`LessonQuestionsList`,
componente client com expandir/recolher por item, primeira pergunta aberta por padrão) — sem
filtro por usuário, pois o objetivo explícito é students diferentes com a mesma dúvida
encontrarem a resposta já pronta.
**Motivo**: pedido explícito do usuário — "quero que elas fiquem salvas com as respostas na
página para se outra pessoa tiver a mesma dúvida ver ali já salva".
**Privacidade**: a lista mostra apenas o primeiro nome de quem perguntou (`user.name.split(" ")[0]`),
não o e-mail nem outros dados do perfil.
**Verificado**: fluxo completo testado ao vivo via Playwright — pergunta feita no diálogo grava
uma linha em `LessonQuestion` (contagem 0→1 confirmada via DB), e após reload da página a
pergunta aparece na lista compartilhada.

## 2026-07-24 — Correção: diálogo "Pergunte ao Professor" sem barra de rolagem

Ver `docs/IMPLEMENTATION_PLAN.md` (entrada correspondente) para o detalhe técnico do fix de CSS
em `DialogContent`/`ask-professor-dialog.tsx`.

## 2026-07-24 — Laboratórios: N:N com aulas + catálogo de cenários reais de produção

**Decisão**: `Laboratory.lessonId` (FK única opcional) foi substituído por uma tabela de junção
`LaboratoryLesson(laboratoryId, lessonId)` — um mesmo laboratório agora pode abranger várias
aulas (inclusive de semanas/módulos diferentes), e uma aula pode ter vários laboratórios.
Migration escrita manualmente (`20260724130000_laboratory_lesson_many_to_many`) em vez de
`prisma migrate dev` interativo, porque havia 1 linha com
`lessonId` não nulo que precisava ser preservada — o SQL faz `INSERT INTO laboratory_lessons
SELECT ...` a partir do valor antigo antes de dropar a coluna, e foi aplicada via
`prisma migrate deploy` (não-interativo). Nenhum dado foi perdido; verificado via query direta
antes e depois.
**Geração por IA revista**: `generateLabContentAction` deixou de operar sobre uma única
`lessonId` e passou a aceitar `lessonIds[]` e/ou `weekNumbers[]` (resolvidos para lessonIds no
servidor) + `title`/`scenario` explícitos — permitindo criar um laboratório "standalone" que
cobre várias semanas de uma vez, além do fluxo rápido de 1 aula (usado dentro do editor de aula,
`LessonLabPanel`, que passa `lessonIds: [lessonId]`). Novo componente `AdminLabGenerator` em
`/admin/labs` expõe esse fluxo multi-semana (título opcional, cenário, "semanas: 20,21") para criar
um laboratório novo; `AdminLabForm` (edição de um laboratório existente) ganhou um botão "Gerar
novamente com IA" que reaproveita `laboratoryId`/`lessonIds`/`title`/`scenario` já salvos —
sem isso não haveria como regenerar um laboratório multi-semana já criado pela UI administrativa.
**Prompt reescrito por completo** (`buildLabGenerationMessage`) a partir do pedido explícito do
usuário: (1) PROIBIDO usar "Labs IA"/"Apex" ou qualquer projeto interno como cenário — obrigatório
usar uma situação real de empresa em produção (API interna, servidor Linux, Kubernetes, CI/CD,
bancos de dados, observabilidade, auth, integração de serviços, dev/homolog/produção, redes/DNS/
proxy/LB, backup/HA, automação de infra, troubleshooting de incidente); (2) tratar o aluno como
leigo completo — nenhum passo pode ser pulado por trivial que pareça; (3) estrutura obrigatória em
Markdown: `## Objetivo`, `## Cenário`, `## Pré-requisitos`, `## Passos` (numerados, cada um com
"Resultado esperado:"), `## Validação final`, `## Erros comuns e troubleshooting` (mín. 4),
`## Resumo e conceitos aplicados` (linkando de volta às aulas/semanas usadas como contexto).
**Otimização de custo/latência**: o contexto enviado ao provider (`currentLessonContent`) foi
reduzido de "conteúdo completo de cada aula concatenado" (podia passar de 100k caracteres quando
um laboratório cobre 10 aulas de 2 semanas, e levou ~2min na primeira geração de teste) para um
trecho de 400 caracteres por aula — os títulos/objetivos completos já vão no corpo do prompt via
`buildLabGenerationMessage`, então o conteúdo integral da aula era redundante para uma tarefa que
é "só prática, não repita a teoria".
**Catálogo completo**: 35 laboratórios cobrindo **todos** os 24 módulos do currículo (não só os
7 com conteúdo diário já aprofundado) — o usuário pediu explicitamente cobertura de todas as
tecnologias estudadas, incluindo módulos ainda no formato legado (1 aula/semana), o que funciona
normalmente porque o prompt de geração só precisa dos títulos/objetivos das aulas para saber quais
tecnologias exercitar, não do conteúdo pedagógico aprofundado. Wave 1 (12 labs, semanas 1–49,
módulos já em formato diário) + wave 2 (22 labs, semanas 50–104, Backend até Engenharia de
Soluções) + 1 lab manual pré-existente (Fase 4, "Preparar o ambiente com Docker Compose") = 36
laboratórios no banco, 35 gerados por IA e aprovados, 283 vínculos laboratório-aula. "Kubernetes"
e "DevOps" (citados explicitamente pelo usuário) não são módulos próprios na grade curricular —
viraram um laboratório dedicado usando a semana 70 (EKS, dentro do módulo AWS) e um laboratório de
promoção de deploy entre ambientes (dev/homolog/produção) reaproveitando semanas de Docker+AWS já
usadas por outros laboratórios (intencional: a mesma aula pode alimentar vários laboratórios).
Catálogos definidos em `scripts/_lab_catalog*.json` (descartáveis, não commitados — mesmo padrão
dos scripts `_apply_daily_module.ts` etc. usados para o conteúdo das aulas).
**Motivo**: pedido explícito do usuário — vários laboratórios guiados passo a passo cobrindo todas
as tecnologias estudadas (incluindo a lista explícita de módulos que ele forneceu), vinculados às
aulas correspondentes, sem usar os projetos internos do curso como cenário, e sim situações reais
de empresas em produção.

## 2026-07-24 — Bug real: laboratórios truncados por orçamento de tokens insuficiente

**O que aconteceu**: a primeira leva de laboratórios gerados (max_tokens: 16000, herdado do
mesmo limite usado para aulas) produziu várias respostas cortadas no meio de uma frase antes de
completar as seções obrigatórias (`## Validação final`, `## Erros comuns`, `## Resumo`) — o
laboratório mais grave tinha apenas 15890 caracteres e terminava literalmente no meio de um
comando `iptables`. Causa provável: modelos com "thinking" intercalado (ver decisão da Etapa 8
sobre parsing da resposta da Claude) consomem parte do orçamento de `max_tokens` em blocos de
raciocínio invisíveis antes do texto final, sobrando menos espaço para uma resposta de 20+ passos
detalhados do que o esperado pelo tamanho em caracteres sozinho sugeriria.
**Correção**: `max_tokens` subido de 16000 para 32000 em `claude-provider.ts` (afeta todas as
chamadas via `callMessages`, não só laboratórios); prompt reforçado com uma regra explícita contra
digressões/passos bônus não pedidos, para não desperdiçar orçamento em conteúdo fora do escopo.
Todos os laboratórios afetados foram identificados por um script de verificação (regex por seção
obrigatória, tolerante a headings com emoji) e regenerados com sucesso — confirmado: 0 laboratórios
com seção faltando em toda a base.
**Bug relacionado (ferramenta de automação, não do produto)**: o primeiro script de regeneração
usava `getByRole("button", { name: "Gerar novamente com IA" }).first()` sem escopo — como esse
botão aparece no cabeçalho de **todo** card de laboratório (visível mesmo com o card recolhido),
`.first()` sempre clicava no primeiro laboratório da lista inteira, não no card do laboratório-alvo
que tinha acabado de ser clicado para expandir. Isso regenerou repetidamente o laboratório errado
("Configurando um servidor Linux...", por ser o mais antigo/primeiro da lista) 3 vezes seguidas,
sem afetar os laboratórios realmente visados. Corrigido escopando a busca ao
`[data-slot='card']` que contém o título exato do laboratório-alvo
(`page.locator("[data-slot='card']").filter({ hasText: title })`) antes de procurar o botão.
Nenhum dado real foi perdido (o laboratório afetado só teve seu próprio conteúdo regenerado/
melhorado); lição registrada para scripts futuros de automação administrativa: nunca usar
`.first()` em um seletor de botão que se repete em múltiplos cards da mesma página — sempre
escopar ao contêiner do item-alvo primeiro.

## 2026-07-24 — Fix: modelo do Gemini desatualizado (mesma classe de bug do Claude na Etapa 8)

**O que aconteceu**: a pedido do usuário, testei a API real do Gemini (`GeminiProvider.
summarizeContent`) e a chamada falhava com 404 "model not found" para `gemini-1.5-flash`
(o valor configurado em `AI_GEMINI_MODEL`). A chave de API em si estava correta (autenticação
passou). Investigando via `GET /v1beta/models`, `gemini-1.5-flash` não aparece mais na lista de
modelos disponíveis para esta chave — descontinuado. Tentativas subsequentes com nomes de modelo
"fixos" mais novos (`gemini-2.5-flash`, `gemini-2.0-flash`) também falharam: o primeiro retorna
404 "no longer available to new users", o segundo retorna 429 (quota 0 no free tier para esse
modelo específico). Apenas o alias `gemini-flash-latest` funcionou — é o nome que o free tier
desta conta realmente tem cota para usar.
**Correção**: `AI_GEMINI_MODEL` atualizado para `gemini-flash-latest` em `.env`, `.env.example`,
e no fallback de `gemini-provider.ts`. Verificado com uma chamada real de resumo, resposta
coerente em português recebida.
**Lição**: mesma classe de problema já visto com o Claude (`claude-3-5-sonnet-latest` → 404,
Etapa 8) — nomes de modelo de IA de terceiros não são estáveis a longo prazo e precisam ser
revalidados quando o usuário reporta (ou quando se testa) falha de chamada. Diferença notável
aqui: para contas free tier do Gemini, o alias `-latest` foi a única opção com cota disponível
(o oposto do padrão geralmente preferido de fixar uma versão exata) — vale reconferir
periodicamente se a conta muda de tier.

## 2026-07-24 — Pergunte ao Professor + geração de laboratórios passam a usar Gemini

**Decisão**: a pedido explícito do usuário, o diálogo "Pergunte ao Professor"
(`askProfessorAction`) e a geração de laboratórios (`generateLabContentAction`) deixaram de usar
`getProviderForPersona("PROFESSOR")` (que resolve para Claude via o roteamento por tarefa TEACH)
e passaram a usar um novo `getGeminiProvider()`, fixo em Gemini, exportado por `gateway.ts`.
Deliberadamente **não** foi um swap global do `AI_TEACHING_PROVIDER` — isso teria arrastado junto
a geração de conteúdo de aula (`generateLessonContentAction`) e o `/ai-tutor` genérico, que
continuam em Claude, um pipeline já validado em 7 módulos e que o usuário não pediu para mudar.
`getGeminiProvider()` reaproveita a mesma lógica de fallback-para-Mock se a chave não estiver
configurada, mantendo a garantia de "nunca lança erro nem quebra o produto".
**Ajuste de orçamento no Gemini**: `GeminiProvider.converse()` (usado por ambos os fluxos acima)
tinha `maxOutputTokens: 700` — suficiente para uma resposta curta de tutor, mas nem perto do
necessário para um laboratório de 20+ passos. Criado um parâmetro `maxOutputTokens` em
`callGenerateContent`, com `converse()` passando 32000; os demais métodos do provider (resumo,
quiz, etc, que devem continuar curtos/baratos) mantêm o default de 700.
**Verificado**: pergunta real feita no diálogo confirmou `provider: "gemini"` gravado em
`LessonQuestion`; um laboratório de teste gerado via Gemini teve qualidade equivalente à do
Claude (todas as 7 seções obrigatórias, cenário realista, sem menção a Labs IA/Apex).

## 2026-07-24 — Segunda rodada de laboratórios (35 novos) via Gemini + cota diária do free tier

**O que aconteceu**: gerando a segunda leva de 35 laboratórios (desafios diferentes dos da
primeira leva, mesma cobertura de módulos) via Gemini, os primeiros 20 foram gerados com sucesso
e os 15 seguintes falharam com HTTP 429. O corpo do erro revelou
`"quotaId": "GenerateRequestsPerDayPerProjectPerModel-FreeTier"`, `"quotaValue": "20"` — ou seja,
**cota diária** de 20 requisições (não por minuto) para o modelo específico por trás do alias
`gemini-flash-latest` (resolvido para `gemini-3.6-flash` nesta conta). Um script de retry com
cooldown de 70s foi tentado primeiro e não ajudou (esperado — cota diária não se recupera em
segundos), então foi abortado.
**Correção**: testados outros nomes de modelo via `GET /v1beta/models` em busca de cota
independente; `gemini-flash-lite-latest` respondeu normalmente (cota separada, por ser um modelo
diferente). `AI_GEMINI_MODEL` foi temporariamente trocado para esse modelo só para concluir esta
leva de laboratórios, e revertido para `gemini-flash-latest` (melhor qualidade) assim que a leva
terminou — o modelo lite fica reservado como plano B para quando a cota diária do flash normal
esgotar.
**Bug de qualidade encontrado e corrigido**: o modelo lite, ao contrário do Claude e do Gemini
flash normal, copiava a descrição da instrução para dentro do próprio título da seção (ex: título
saía como "## Objetivo — 2-3 frases sobre..." em vez de apenas "## Objetivo") — o prompt original
usava "## Título — descrição" na mesma linha, o que modelos mais fracos interpretam como texto
literal a reproduzir. Corrigido em `buildLabGenerationMessage` (`laboratories/actions.ts`):
instruções viraram uma lista numerada separada dos títulos, com um exemplo explícito de como cada
título deve aparecer sozinho na resposta ("## Objetivo", "## Cenário", etc). Resultado após o
fix: 0 laboratórios com o problema, em nenhum dos dois modelos.
**Resultado final**: 71 laboratórios no banco (36 da primeira leva incluindo o manual pré-
existente + 35 da segunda leva), 581 vínculos laboratório-aula, 0 laboratórios e 0 aulas em
`DRAFT`. Segunda leva com desafios de produção **diferentes** da primeira (não repete cenários),
cobrindo os mesmos 24 módulos por outro ângulo (ex: primeira leva = "montar do zero", segunda
leva = "investigar/corrigir um incidente" no mesmo módulo).

## 2026-07-24 — Terceira trilha ("Profissional") + Trilha Produto deixa de estar vazia

**O que aconteceu**: o usuário reportou que "as trilhas ficaram vazias" e descreveu uma visão de
3 trilhas paralelas: Formação (o que se estuda), Produto (aplicar o aprendizado construindo o
próprio SaaS "APEX Academy" — a plataforma) e Profissional (habilidades de mercado/carreira que
normalmente ficam fora de cursos técnicos). Investigando: a Trilha Formação e a Trilha Produto já
existiam (`roadmap-explorer.tsx`, tabs), mas a Trilha Produto estava genuinamente vazia — nenhum
`ArchitectureMilestone(track: PRODUCT)` tinha sido criado para nenhuma das 104 semanas (por
design: a Etapa 4 deliberadamente não pré-cria marcos de produto em massa, só sob demanda pelo
admin — ver decisão "Etapa 4" anterior). A Trilha Profissional não existia.
**Decisão**: `MilestoneTrack` ganhou um terceiro valor, `PROFESSIONAL`, reaproveitando
`ArchitectureMilestone` (mesmo padrão de `PRODUCT` vs `AI_LABS`) em vez de criar um novo modelo —
consistente com a filosofia de schema mínimo do projeto. Como `ArchitectureMilestone.weekId` é
`@unique` **na tabela inteira** (não por track), uma semana só pode ter UM marco no total —
Produto e Profissional nunca coexistem na mesma semana, então o conteúdo dos dois foi distribuído
em semanas distintas (24 marcos de Produto, um por módulo, ancorado na última semana de cada
módulo; 16 marcos Profissionais, um por habilidade de carreira listada pelo usuário, espalhados
pelas semanas restantes).
**UI**: `RoadmapExplorer` ganhou uma terceira aba "Trilha Profissional"; `/roadmap/[weekId]`
mostra o card certo (Produto ou Profissional) conforme o `track` do marco vinculado à semana, ou
"a definir" se nenhum. `ProductMilestoneForm` (admin) foi generalizado para `MilestoneForm` com
um seletor de trilha — antes só permitia criar marcos de Produto; a action foi renomeada de
`saveProductMilestoneAction` para `saveMilestoneAction(track, ...)`.
**Conteúdo**: os 24 marcos de Produto seguem a narrativa "terminou a disciplina → aplica no
produto" descrita pelo usuário (ex.: Docker → Dockerfile → Compose → Volumes → Nginx → Deploy →
CI/CD; FastAPI → login/JWT/refresh token; PostgreSQL → schema real de Aluno/Curso/Projeto/XP;
n8n → automatizar onboarding/certificados). Os 16 marcos Profissionais cobrem exatamente as 16
habilidades listadas pelo usuário (conversar com clientes, levantar requisitos, estimar esforço,
documentação técnica, code review, issues no GitHub, backlog, sprints, apresentar arquitetura,
portfólio, currículo técnico, LinkedIn, entrevista técnica, precificar consultoria, transformar
projeto em SaaS). Populado via script direto (upsert no banco, sem geração por IA — são 40
entradas curadas manualmente, título+descrição curtos, não justificam um pipeline de IA).
**Verificado**: as 3 abas do `/roadmap` renderizam corretamente com Playwright (screenshots);
`/roadmap/[weekId]` (semana 61, Docker) mostra o marco de Produto real; o formulário admin
generalizado mostra a trilha certa pré-selecionada.

## 2026-07-24 — Desfazer conclusão de aula + bug real de XP duplicado corrigido no processo

**Decisão**: `LessonCompleteForm` (`/learn/[lessonId]`) ganhou um botão "Desfazer conclusão"
(com confirmação via `window.confirm`, já que apaga a reflexão registrada), visível só quando a
aula já está concluída. Nova action `uncompleteLessonAction(lessonId)`: apaga o `LessonCompletion`
do usuário, reverte o XP daquela conclusão (`experienceEvent.deleteMany` filtrando
`refType: "Lesson", refId: lessonId`), e chama `recomputeSkillsForLesson` de novo para recalcular
a evidência de competências (a função já é 100% derivada de `COUNT(LessonCompletion)`, então só
recontar já corrige sozinho). Badges já concedidos **não** são revogados — mesmo padrão de
"conquista não se perde" comum em gamificação.
**Bug real encontrado e corrigido no mesmo commit**: `completeLessonAction` chamava
`awardXp(..., 10, ...)` **incondicionalmente**, inclusive quando o usuário só estava atualizando
a reflexão de uma aula já concluída (botão "Atualizar reflexão") — cada reenvio do formulário
concedia mais 10 XP, sem limite, para a mesma aula. Corrigido checando se já existia um
`LessonCompletion` **antes** do upsert; XP só é concedido na primeira conclusão. Verificado ao
vivo via Playwright: concluir uma aula grava 1 evento de XP; reabrir e desfazer remove a
completion e o evento de XP, e o botão volta a mostrar "Concluir aula".

<!-- Novas decisões devem ser adicionadas acima desta linha, em ordem cronológica reversa não é
necessária — apenas anexe no final da fase correspondente. -->
