# Product Spec — AI Platform Engineer Academy

> Fonte de verdade para este documento: `Curso.md` (raiz do repositório). Este arquivo é uma
> transcrição de conversa em que o programa foi desenhado — não é uma grade curricular formal.
> Tudo que não está explicitamente definido em `Curso.md` é tratado como **planejado/rascunho**,
> nunca como conteúdo oficial. Ver `docs/DECISIONS.md` para as escolhas tomadas onde a fonte é
> ambígua ou omissa.

## 1. O que é

Um webapp de estudos que organiza, acompanha e executa a formação **AI Platform Engineer Academy**
— "Da Infraestrutura à Inteligência Artificial". Funciona simultaneamente como:

- plataforma de cursos
- painel de acompanhamento (dashboard)
- planejador de estudos
- roadmap profissional
- gerenciador de projetos/laboratórios
- caderno de anotações
- construtor de portfólio
- sistema de revisão (quizzes/flashcards)
- tutor de IA (nível 1)
- histórico da evolução de uma empresa fictícia ("AI Labs")
- mapa de competências

## 2. Extraído de `Curso.md`

### 2.1 Identidade do programa

- **Nome**: AI Platform Engineer Academy
- **Subtítulo**: "Da Infraestrutura à Inteligência Artificial"
- **Lema (opcional)**: "Construa. Automatize. Escale. Inove."
- **Duração**: ~24 meses / 104 semanas
- **Carga**: 5 dias/semana, 3h30/dia, ~1.700 horas totais
- **Guarda-chuva ("universidade") mencionado, não decidido**: "APEX Academy" — tratado como ideia
  em aberto, não adotado como nome oficial do produto (ver DECISIONS.md).

### 2.2 Estrutura em semestres (única segmentação temporal explícita)

O arquivo define 6 "semestres" nomeados, sem detalhamento semanal:

1. Fundamentos da Engenharia de Software e Infraestrutura
2. Desenvolvimento Backend e Arquitetura
3. Cloud, DevOps e Plataformas
4. Inteligência Artificial e Sistemas Autônomos
5. Arquitetura Empresarial e Escalabilidade
6. Projeto Final – Plataforma Comercial de IA

Não há divisão de semestres em módulos/semanas/aulas no texto-fonte. Essa divisão será modelada
como estrutura vazia (`PLANNED`) a ser preenchida via área administrativa.

### 2.3 Áreas de conhecimento citadas

Engenharia de Software, Backend (Python/FastAPI), Banco de Dados (Firebird, PostgreSQL, Redis,
MongoDB, Qdrant), Front-end (HTML/CSS/JS/TS/React/Next.js), Infraestrutura (Linux, redes, DNS,
Nginx, VPN, Docker, Kubernetes, storage, backup, observabilidade), DevOps (Git/GitHub/Actions/
CI-CD), AWS (IAM, VPC, EC2, RDS, Lambda, ECS, EKS, Bedrock, CloudWatch, Route 53, S3, FinOps),
Inteligência Artificial (LLMs, Prompt Engineering, RAG, Embeddings, MCP, Function Calling,
Multiagentes), Automação (n8n, Evolution API, WhatsApp), Frameworks de Agentes (Hermes, OpenClaw),
Arquitetura Corporativa (microsserviços, event-driven, RabbitMQ, Kafka), Segurança (OAuth, JWT,
RBAC, Cloudflare, WAF), Observabilidade (OpenTelemetry, Prometheus, Grafana, Loki, CloudWatch),
Soft Skills, Engenharia de Produto, Leitura de código open source.

### 2.4 Semana 0 — Preparação do Ambiente

Checklist explícito por categoria: Sistema (Windows/WSL2/Ubuntu), IDE (VS Code + extensões),
Ferramentas de IA (ChatGPT, Claude, Gemini, OpenCode, Copilot), Versionamento (Git/GitHub/SSH),
Terminal (PowerShell/Windows Terminal/Bash), Docker (Desktop/Compose), Navegadores (Chrome/
Firefox), Banco (DBeaver, Firebird, PostgreSQL, Redis), API (Postman, Insomnia, Bruno),
Desenvolvimento (Python, Node.js, uv), Diagramas (Draw.io, Mermaid), Documentação (Markdown,
MkDocs).

### 2.5 Empresa fictícia — AI Labs

Departamentos: Infraestrutura, Backend, Front-end, IA, DevOps, Cloud, Segurança, Dados, Produto,
Arquitetura.

Linha do tempo de evolução da plataforma (ordem citada no texto): GitHub → README → Hello World →
… → Cloudflare → AWS → Nginx → Docker → Kubernetes → FastAPI → React → Redis → RabbitMQ →
PostgreSQL → Firebird → Qdrant → OpenAI → Claude → Bedrock → MCP → n8n → Hermes → OpenClaw →
Observabilidade → CI/CD.

### 2.6 Princípio pedagógico

"Nunca estudar uma tecnologia sem aplicá-la em um projeto real." — todo módulo deve produzir
incremento verificável na plataforma única construída ao longo da formação.

### 2.7 Checklist de qualidade de portfólio (GitHub)

README, Arquitetura, Diagramas, Docker, Testes, CI/CD, Releases, Changelog, Licença, Roadmap,
commits claros, issues, milestones.

### 2.8 Explicitamente NÃO definido em `Curso.md` (tratar como `PLANNED`/`DRAFT`)

- Grade semanal das 104 semanas (títulos, objetivos, conteúdos por semana)
- Lista de módulos dentro de cada semestre
- Lista de projetos/laboratórios específicos com requisitos
- Lista de competências com critérios de nível
- Certificações internas nomeadas
- Bibliografia/documentação oficial de referência por módulo

## 3. Personas

- **Estudante (STUDENT)**: usuário principal; consome currículo, registra progresso, usa
  planejador, tutor de IA, portfólio.
- **Administrador (ADMIN)**: mantém o currículo, projetos, laboratórios, avaliações,
  competências, importações de `Curso.md` e evolução da AI Labs.

## 4. Fora de escopo do MVP

Microsserviços, Kubernetes local, dependência obrigatória de AWS, dependência obrigatória de
provedor de IA externo, banco vetorial, múltiplos agentes autônomos, execução automática de
comandos pela IA, tradução completa (i18n preparado, não implementado).

## 5. Critérios de sucesso

Ver seção "Standards and Success Criteria" do prompt original, resumida em
`docs/IMPLEMENTATION_PLAN.md`.
