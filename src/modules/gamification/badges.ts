export const BADGE_CATALOG = [
  {
    code: "ambiente_preparado",
    name: "Ambiente preparado",
    description: "Completou 100% do checklist da Semana 0.",
    icon: "Laptop",
  },
  {
    code: "primeira_aula",
    name: "Primeira aula concluída",
    description: "Concluiu sua primeira aula.",
    icon: "BookOpen",
  },
  {
    code: "primeiro_laboratorio",
    name: "Primeiro laboratório",
    description: "Concluiu seu primeiro laboratório.",
    icon: "FlaskConical",
  },
  {
    code: "primeiro_projeto",
    name: "Primeiro projeto",
    description: "Enviou sua primeira submissão de projeto.",
    icon: "FolderKanban",
  },
  {
    code: "primeiro_deploy",
    name: "Primeiro deploy",
    description: "Registrou uma URL de deploy em um projeto.",
    icon: "Rocket",
  },
  {
    code: "primeiro_teste",
    name: "Primeira avaliação",
    description: "Respondeu seu primeiro quiz.",
    icon: "ClipboardCheck",
  },
  {
    code: "primeiro_container",
    name: "Primeiro container",
    description: "Marcou o Docker como preparado na Semana 0.",
    icon: "Container",
  },
  {
    code: "sequencia_30_dias",
    name: "30 dias de estudo",
    description: "Manteve uma sequência de estudo de 30 dias.",
    icon: "Flame",
  },
  {
    code: "100_horas",
    name: "100 horas de estudo",
    description: "Acumulou 100 horas de sessões de estudo.",
    icon: "Trophy",
  },
] as const;

export type BadgeCode = (typeof BADGE_CATALOG)[number]["code"];
