import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ShareButton({
  platformLabel,
  label,
  className,
}: {
  platformLabel: string;
  label?: string;
  className?: string;
}) {
  return (
    <button
      className={cn(
        "flex h-10 w-fit items-center gap-2 rounded-(--r-pill) bg-violet-600 px-4 text-[13.5px] font-medium text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15 transition-[background-color,scale] duration-150 hover:bg-violet-500 active:scale-(--press)",
        className,
      )}
    >
      <Share2 className="size-4" />
      {label ?? `Share on ${platformLabel}`}
    </button>
  );
}
