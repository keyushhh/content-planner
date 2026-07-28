import { cn } from "@/lib/utils";

/**
 * The secondary action: an outlined pill.
 *
 * One rung below the primary and one above a bare label. The fill is left to
 * whatever surface it sits on and only appears on hover, so the single filled,
 * coloured thing in any given row stays the primary — a solid secondary (white
 * especially, against these dark surfaces) carries enough luminance weight to
 * read as a second CTA and the two end up competing.
 *
 * Used by Invite / Import in the repository toolbar and AI Assist in the
 * composer. They are the same kind of thing, so they get the same paint.
 */
const SECONDARY_ACTION_BASE =
  "flex items-center gap-1.5 rounded-full font-medium text-foreground/85 inset-ring-1 inset-ring-white/[0.12] transition-[background-color,box-shadow,color,scale] duration-150 hover:bg-white/[0.06] hover:text-foreground hover:inset-ring-white/20";

/** Toolbar scale — pairs with the h-8 filters and the primary button. */
export const SECONDARY_ACTION = cn(
  SECONDARY_ACTION_BASE,
  "h-8 px-3 text-[13px] active:scale-[0.97]",
);

/** Inline scale, for the compact action rows inside a composer field header. */
export const SECONDARY_ACTION_SM = cn(
  SECONDARY_ACTION_BASE,
  "h-7 px-2.5 text-xs active:scale-[0.96]",
);
