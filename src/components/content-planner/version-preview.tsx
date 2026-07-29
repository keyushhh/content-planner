"use client";

import { cn } from "@/lib/utils";
import type { AppVersion } from "./version-chooser-modal";

/**
 * A miniature of each version's actual screen, drawn in divs rather than shipped
 * as an image: it stays crisp at any size, costs no request, and — the reason
 * that matters — it cannot fall out of date silently the way a screenshot does.
 *
 * Deliberately abstract. No legible text, because a mini that tries to be a
 * screenshot invites you to read it; this one is meant to be recognised at a
 * glance by its SHAPE. The shapes are the actual difference between the two
 * products: Classic has a campaign rail and one campaign's list, Repository has
 * no rail and one long filtered table.
 */

/** A row of text-ish bars. `w` is a tailwind width per line. */
function Lines({ widths, className }: { widths: string[]; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-[3px]", className)}>
      {widths.map((w, i) => (
        <span key={i} className={cn("h-[3px] rounded-full bg-white/15", w)} />
      ))}
    </div>
  );
}

/** One table row: a wide name bar plus a couple of narrow column bars. */
function Row({ accent }: { accent?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "h-[3.5px] flex-1 rounded-full",
          accent ? "bg-white/25" : "bg-white/13",
        )}
      />
      <span className="h-[3.5px] w-[13%] shrink-0 rounded-full bg-white/10" />
      <span className="h-[3.5px] w-[9%] shrink-0 rounded-full bg-white/10" />
    </div>
  );
}

export function VersionPreview({
  version,
  className,
}: {
  version: AppVersion;
  className?: string;
}) {
  const isRepo = version === "repository";

  return (
    <div
      aria-hidden
      className={cn(
        "relative aspect-[16/10] w-full overflow-hidden rounded-[10px] bg-[oklch(0.19_0_0)] inset-ring-1 inset-ring-white/[0.07]",
        // Each version's own wash, the same hue its icon well carries.
        isRepo
          ? "bg-[radial-gradient(120%_100%_at_50%_0%,rgba(139,92,246,0.13),transparent_62%),oklch(0.19_0_0)]"
          : "bg-[radial-gradient(120%_100%_at_15%_0%,rgba(56,189,248,0.13),transparent_62%),oklch(0.19_0_0)]",
        className,
      )}
    >
      {/* Window chrome. Three dots is all it takes to read as "a screen", and
          it gives the miniature a horizon so the layout below sits somewhere. */}
      <div className="flex h-[11%] items-center gap-[3px] border-b border-white/[0.06] px-[5px]">
        <span className="size-[3px] rounded-full bg-white/20" />
        <span className="size-[3px] rounded-full bg-white/13" />
        <span className="size-[3px] rounded-full bg-white/13" />
      </div>

      <div className="flex h-[89%]">
        {/* Classic's campaign rail — the single clearest difference between the
            two screens, so it is the first thing the eye can use. */}
        {!isRepo && (
          <div className="flex w-[26%] shrink-0 flex-col gap-[5px] border-r border-white/[0.06] bg-white/[0.022] p-[6px]">
            <span className="h-[3px] w-2/3 rounded-full bg-sky-300/45" />
            <Lines widths={["w-full", "w-4/5", "w-full", "w-3/5", "w-4/5"]} />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-[5px] p-[7px]">
          {isRepo ? (
            <>
              {/* A big page title, then the filter row: search, three controls,
                  and a primary action pinned right. */}
              <span className="h-[5px] w-[38%] rounded-full bg-white/30" />
              <div className="flex items-center gap-[3px]">
                <span className="h-[5px] w-[26%] rounded-full bg-white/[0.09]" />
                <span className="h-[5px] w-[13%] rounded-full bg-white/[0.09]" />
                <span className="h-[5px] w-[11%] rounded-full bg-white/[0.09]" />
                <span className="ml-auto h-[5px] w-[18%] rounded-full bg-violet-400/60" />
              </div>
            </>
          ) : (
            /* Classic's header: the campaign's name, and its actions. */
            <div className="flex items-center gap-[3px]">
              <span className="size-[6px] shrink-0 rounded-[2px] bg-sky-400/55" />
              <span className="h-[4px] w-[34%] rounded-full bg-white/25" />
              <span className="ml-auto h-[4px] w-[13%] rounded-full bg-white/[0.09]" />
              <span className="h-[4px] w-[13%] rounded-full bg-white/[0.09]" />
            </div>
          )}

          {/* The table. Repository's is longer, and says so. */}
          <div
            className={cn(
              "flex flex-col rounded-[5px] bg-white/[0.028] p-[5px] inset-ring-1 inset-ring-white/[0.05]",
              isRepo ? "flex-1 gap-[5px]" : "gap-[6px]",
            )}
          >
            {Array.from({ length: isRepo ? 6 : 4 }).map((_, i) => (
              <Row key={i} accent={i === 0} />
            ))}
            {/* Pagination — only Repository pages, because only it has to. */}
            {isRepo && (
              <div className="mt-auto flex items-center gap-[3px] pt-[2px]">
                <span className="h-[3px] w-[16%] rounded-full bg-white/[0.08]" />
                <span className="ml-auto size-[4px] rounded-full bg-violet-400/50" />
                <span className="size-[4px] rounded-full bg-white/[0.08]" />
                <span className="size-[4px] rounded-full bg-white/[0.08]" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
