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

<!-- Novas decisões devem ser adicionadas acima desta linha, em ordem cronológica reversa não é
necessária — apenas anexe no final da fase correspondente. -->
