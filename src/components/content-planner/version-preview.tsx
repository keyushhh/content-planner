"use client";

import { cn } from "@/lib/utils";
import type { AppVersion } from "./version-chooser-modal";

function Lines({ widths, className }: { widths: string[]; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-[3px]", className)}>
      {widths.map((w, i) => (
        <span key={i} className={cn("h-[3px] rounded-(--r-pill) bg-(--ink)/15", w)} />
      ))}
    </div>
  );
}

function Row({ accent }: { accent?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "h-[3.5px] flex-1 rounded-(--r-pill)",
          accent ? "bg-(--ink)/25" : "bg-(--ink)/13",
        )}
      />
      <span className="h-[3.5px] w-[13%] shrink-0 rounded-(--r-pill) bg-(--ink)/10" />
      <span className="h-[3.5px] w-[9%] shrink-0 rounded-(--r-pill) bg-(--ink)/10" />
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
        "relative aspect-[16/10] w-full overflow-hidden rounded-(--r-inner) bg-[oklch(0.19_0_0)] inset-ring-1 inset-ring-(--ink)/[0.07]",
        isRepo
          ? "bg-[radial-gradient(120%_100%_at_50%_0%,rgba(139,92,246,0.13),transparent_62%),oklch(0.19_0_0)]"
          : "bg-[radial-gradient(120%_100%_at_15%_0%,rgba(56,189,248,0.13),transparent_62%),oklch(0.19_0_0)]",
        className,
      )}
    >
      <div className="flex h-[11%] items-center gap-[3px] border-b border-(--ink)/[0.06] px-[5px]">
        <span className="size-[3px] rounded-(--r-pill) bg-(--ink)/20" />
        <span className="size-[3px] rounded-(--r-pill) bg-(--ink)/13" />
        <span className="size-[3px] rounded-(--r-pill) bg-(--ink)/13" />
      </div>

      <div className="flex h-[89%]">
        {!isRepo && (
          <div className="flex w-[26%] shrink-0 flex-col gap-[5px] border-r border-(--ink)/[0.06] bg-(--ink)/[0.022] p-[6px]">
            <span className="h-[3px] w-2/3 rounded-(--r-pill) bg-sky-300/45" />
            <Lines widths={["w-full", "w-4/5", "w-full", "w-3/5", "w-4/5"]} />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-[5px] p-[7px]">
          {isRepo ? (
            <>
              <span className="h-[5px] w-[38%] rounded-(--r-pill) bg-(--ink)/30" />
              <div className="flex items-center gap-[3px]">
                <span className="h-[5px] w-[26%] rounded-(--r-pill) bg-(--ink)/[0.09]" />
                <span className="h-[5px] w-[13%] rounded-(--r-pill) bg-(--ink)/[0.09]" />
                <span className="h-[5px] w-[11%] rounded-(--r-pill) bg-(--ink)/[0.09]" />
                <span className="ml-auto h-[5px] w-[18%] rounded-(--r-pill) bg-violet-400/60" />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-[3px]">
              <span className="size-[6px] shrink-0 rounded-[2px] bg-sky-400/55" />
              <span className="h-[4px] w-[34%] rounded-(--r-pill) bg-(--ink)/25" />
              <span className="ml-auto h-[4px] w-[13%] rounded-(--r-pill) bg-(--ink)/[0.09]" />
              <span className="h-[4px] w-[13%] rounded-(--r-pill) bg-(--ink)/[0.09]" />
            </div>
          )}

          <div
            className={cn(
              "flex flex-col rounded-(--r-inner) bg-(--ink)/[0.028] p-[5px] inset-ring-1 inset-ring-(--ink)/[0.05]",
              isRepo ? "flex-1 gap-[5px]" : "gap-[6px]",
            )}
          >
            {Array.from({ length: isRepo ? 6 : 4 }).map((_, i) => (
              <Row key={i} accent={i === 0} />
            ))}
            {isRepo && (
              <div className="mt-auto flex items-center gap-[3px] pt-[2px]">
                <span className="h-[3px] w-[16%] rounded-(--r-pill) bg-(--ink)/[0.08]" />
                <span className="ml-auto size-[4px] rounded-(--r-pill) bg-violet-400/50" />
                <span className="size-[4px] rounded-(--r-pill) bg-(--ink)/[0.08]" />
                <span className="size-[4px] rounded-(--r-pill) bg-(--ink)/[0.08]" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
