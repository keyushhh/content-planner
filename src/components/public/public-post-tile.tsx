import { Check, ImageIcon } from "lucide-react";
import { mediaAssets as staticMediaAssets } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { Session } from "@/lib/types";

export function PublicPostTile({
  session,
  picked,
  onToggle,
}: {
  session: Session;
  picked: boolean;
  onToggle: () => void;
}) {
  const image = session.visualAssetIds
    .map((id) => staticMediaAssets.find((a) => a.id === id))
    .find((a): a is NonNullable<typeof a> => Boolean(a) && a!.type === "image");
  const copy = session.copy.trim();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className={cn(
        "group relative self-start cursor-pointer overflow-hidden rounded-(--r-surface) bg-white text-neutral-900 shadow-(--lift-md) transition-[box-shadow,opacity] duration-150",
        !picked && "opacity-55 hover:opacity-80",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute right-2.5 top-2.5 z-10 flex size-6 items-center justify-center rounded-(--r-round) shadow-(--lift-sm) transition-[background-color] duration-150",
          picked
            ? "bg-violet-600 text-white"
            : "bg-white/95 text-transparent inset-ring-1 inset-ring-black/10 group-hover:text-neutral-300",
        )}
      >
        <Check className="size-3.5" strokeWidth={3} />
      </span>

      {image ? (
        image.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.url} alt="" className="aspect-[4/3] w-full object-cover" />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center bg-neutral-100 text-neutral-300">
            <ImageIcon className="size-7" />
          </div>
        )
      ) : null}

      <div className="p-3.5">
        <p className="line-clamp-3 text-[13px] leading-[1.5] text-pretty text-neutral-800">
          {copy || <span className="italic text-neutral-400">No copy yet.</span>}
        </p>
      </div>
    </div>
  );
}
