import { cn } from "@/lib/utils";

const SECONDARY_ACTION_BASE =
  "flex items-center gap-1.5 rounded-(--r-pill) font-medium text-foreground/85 inset-ring-1 inset-ring-(--ink)/[0.12] transition-[background-color,box-shadow,color,scale] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground hover:inset-ring-(--ink)/20";

export const SECONDARY_ACTION = cn(
  SECONDARY_ACTION_BASE,
  "h-8 px-3 text-[13px] active:scale-(--press)",
);

export const SECONDARY_ACTION_SM = cn(
  SECONDARY_ACTION_BASE,
  "h-7 px-2.5 text-xs active:scale-(--press)",
);

// Header-row size: page headers run h-9, so SECONDARY_ACTION's h-8 misaligns there.
export const SECONDARY_ACTION_MD = cn(
  SECONDARY_ACTION_BASE,
  "h-9 px-3.5 text-[13px] active:scale-(--press)",
);
