import {
  BookOpen,
  Container,
  Flame,
  FlaskConical,
  FolderKanban,
  Laptop,
  ClipboardCheck,
  Rocket,
  Trophy,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  BookOpen,
  Container,
  Flame,
  FlaskConical,
  FolderKanban,
  Laptop,
  ClipboardCheck,
  Rocket,
  Trophy,
};

export function BadgeIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Trophy;
  return <Icon className={className} />;
}
