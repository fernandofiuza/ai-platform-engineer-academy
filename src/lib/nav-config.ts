import type { LucideIcon } from "lucide-react";
import {
  Layers,
  BookOpen,
  Briefcase,
  Building2,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  FlaskConical,
  FolderKanban,
  LayoutDashboard,
  Map,
  NotebookPen,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Aprendizagem",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Roadmap", href: "/roadmap", icon: Map },
      { title: "Aprender", href: "/learn", icon: BookOpen },
      { title: "Planejador", href: "/planner", icon: CalendarClock },
      { title: "Calendário", href: "/calendar", icon: CalendarDays },
      { title: "Sessões de estudo", href: "/sessions", icon: Timer },
    ],
  },
  {
    label: "Prática",
    items: [
      { title: "Projetos", href: "/projects", icon: FolderKanban },
      { title: "Laboratórios", href: "/labs", icon: FlaskConical },
      { title: "Avaliações", href: "/assessments", icon: ClipboardCheck },
      { title: "Flashcards", href: "/flashcards", icon: Layers },
      { title: "Anotações", href: "/notes", icon: NotebookPen },
    ],
  },
  {
    label: "Carreira",
    items: [
      { title: "Competências", href: "/skills", icon: Target },
      { title: "Portfólio", href: "/portfolio", icon: Briefcase },
      { title: "AI Labs", href: "/ai-labs", icon: Building2 },
    ],
  },
  {
    label: "Inteligência Artificial",
    items: [{ title: "Tutor de IA", href: "/ai-tutor", icon: Sparkles }],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((section) => section.items);
