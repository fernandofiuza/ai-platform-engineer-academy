# Curriculum Import — `Curso.md`

> Atualizado na Fase 2 para refletir a implementação real
> (`src/modules/curriculum-import/{parser,service}.ts`). A versão original deste documento
> (Etapa 1) especulava uma estratégia de parsing genérica por "blocos de conversa"; na prática,
> como `Curso.md` não tem headings Markdown reais (é uma transcrição de chat colada), o parser
> usa âncoras de texto literal + regex direcionados, não um parser genérico de Markdown. Ver
> `docs/DECISIONS.md` para o porquê dessa escolha e para o bug de CRLF encontrado e corrigido.

## Objetivo

Importar `Curso.md` para o banco como conteúdo estrutural rastreável, preservando o texto
original e sinalizando ambiguidade em vez de inventar estrutura.

## O que é extraído hoje (Fase 2)

- **Program**: nome, subtítulo, duração (24 meses / 104 semanas), carga (5d/sem, 3h30/dia).
  Extraído por âncora literal (`raw.includes("24 meses")` etc.) — se a âncora não for encontrada
  (ex.: o texto for editado), gera `ImportWarning` e mantém o último valor conhecido.
- **6 Semestres (`Phase`)**: extraídos via regex `/(\d)º Semestre\s*\n\s*([^\n]+)/g`, na ordem em
  que aparecem no arquivo.
- **Semana 0 — Preparação do Ambiente**: bloco delimitado pelas âncoras
  `"Instalaremos e configuraremos:"` … `"\nDepois\n"`. Dentro dele, um allowlist de 12 categorias
  conhecidas (Sistema, IDE, IA, Versionamento, Terminal, Docker, Navegadores, Banco, API,
  Desenvolvimento, Diagramas, Documentação) decide onde cada `ChecklistItem` começa; linhas com
  prefixo "✅ " têm o prefixo removido. Resultado: 40 itens.
- **Semanas 1–104**: criadas vazias (`status = PLANNED`, título `"Semana N — a definir"`),
  distribuídas nos 6 semestres em faixas contíguas o mais uniformes possível (ver
  `docs/DECISIONS.md`).

## O que ainda NÃO é extraído (fica para fases futuras)

- Áreas de conhecimento / tecnologias citadas → `Technology`/`Skill` (Fase 4, junto com o mapa de
  competências).
- Departamentos e linha do tempo de arquitetura da AI Labs → `Department`/`ArchitectureMilestone`
  (Fase 4, junto com a seção "AI Labs" da plataforma).
- Conteúdo semana a semana (1–104), módulos/trilhas dentro de cada semestre, projetos/
  laboratórios específicos, competências com critérios de nível, certificações internas,
  bibliografia oficial — nada disso está em `Curso.md` de forma extraível; continuam como
  estrutura vazia/planejada até serem definidos manualmente pela área administrativa (Fase 6).

## Avisos (`ImportWarning`)

Gerados quando:
1. uma âncora literal esperada do `Program` não é encontrada;
2. o número de semestres encontrados é diferente de 6;
3. o bloco da Semana 0 não é encontrado;
4. há linhas dentro do bloco da Semana 0 antes de qualquer categoria conhecida;
5. uma das 12 categorias esperadas não aparece no bloco.

Na execução atual contra `Curso.md`, **zero avisos** são gerados (todas as âncoras batem).

## Idempotência

- Uma `ImportJob` é criada a cada execução, com hash SHA-256 do conteúdo do arquivo
  (`ImportJob.contentHash`). Se o hash não mudou desde a última importação bem-sucedida
  (mesmo `sourceFile` + mesmo hash), o comando informa que não há novidade e não toca no banco.
- `Program`/`Phase`/`Week` (0) upsert por chave natural (`slug`; `programId+order`;
  `programId+number`). `ChecklistItem` upsert por `(weekId, category, label)`. `Week` 1–104: só
  criadas se ainda não existirem (nunca atualizadas pela importação, já que não têm conteúdo
  vindo do arquivo para atualizar).
- **Ainda não implementado**: a proteção `isManuallyEdited` descrita originalmente (impedir que a
  reimportação sobrescreva uma edição manual). Não há caminho de código que edite essas entidades
  manualmente antes da Fase 6 (CRUD administrativo), então não há nada para proteger ainda — ver
  `docs/DECISIONS.md`.

## Relatório de importação

Persistido em `ImportJob` (`createdCount`, `updatedCount`, `skippedCount`, `report` JSON) e nas
linhas de `ImportWarning`. Visível em `/admin/imports` (contadores + lista de avisos) e no
console ao rodar o comando.

## Comando

```bash
npm run curriculum:import        # importa (ou confirma que não há mudanças)
npm run curriculum:import -- --force   # força reimportação mesmo com hash igual
```

`prisma/seed.ts` chama a mesma função `importCurriculum()` (não há duas fontes de verdade de
parsing) e, em seguida, cria 2 aulas de demonstração na Semana 0 com conteúdo derivado de
`Curso.md` (nome/subtítulo/duração do programa e o princípio pedagógico "nunca estudar uma
tecnologia sem aplicá-la").
