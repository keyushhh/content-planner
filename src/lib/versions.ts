import type { LucideIcon } from "lucide-react";
import { CalendarDays, Database } from "lucide-react";

export type AppVersion = "classic" | "repository";

export const VERSIONS: {
  id: AppVersion;
  label: string;
  hint: string;
  icon: LucideIcon;
  well: string;
  glow: string;
  ring: string;
}[] = [
  {
    id: "classic",
    label: "Classic",
    hint: "One campaign at a time",
    icon: CalendarDays,
    well: "bg-sky-500/[0.14] text-sky-300 inset-ring-sky-400/25",
    glow: "hover:inset-ring-sky-400/45 hover:bg-sky-500/[0.05]",
    ring: "group-hover:inset-ring-sky-400/40",
  },
  {
    id: "repository",
    label: "Repository",
    hint: "Everything, across every campaign",
    icon: Database,
    well: "bg-violet-500/[0.14] text-violet-300 inset-ring-violet-400/25",
    glow: "hover:inset-ring-violet-400/45 hover:bg-violet-500/[0.05]",
    ring: "group-hover:inset-ring-violet-400/40",
  },
];

export const versionMeta = (v: AppVersion) => VERSIONS.find((x) => x.id === v)!;
