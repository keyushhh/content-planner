import { cn } from "@/lib/utils";

/**
 * The secondary action: an outlined pill, one rung below the primary and one
 * above a bare label.
 */
const SECONDARY_ACTION_BASE =
  "flex items-center gap-1.5 rounded-(--r-pill) font-medium text-foreground/85 inset-ring-1 inset-ring-(--ink)/[0.12] transition-[background-color,box-shadow,color,scale] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground hover:inset-ring-(--ink)/20";

/** Toolbar scale, pairs with the h-8 filters and the primary button. */
export const SECONDARY_ACTION = cn(
  SECONDARY_ACTION_BASE,
  "h-8 px-3 text-[13px] active:scale-(--press)",
);

/** Inline scale, for the compact action rows inside a composer field header. */
export const SECONDARY_ACTION_SM = cn(
  SECONDARY_ACTION_BASE,
  "h-7 px-2.5 text-xs active:scale-(--press)",
);
