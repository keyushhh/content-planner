import { cn } from "@/lib/utils";
import { ImageIcon, Link2, FileText } from "lucide-react";
import type { MediaAssetType } from "@/lib/types";

const PALETTE = [
  "from-violet-500/40 to-indigo-500/10",
  "from-emerald-500/40 to-teal-500/10",
  "from-amber-500/40 to-orange-500/10",
  "from-pink-500/40 to-rose-500/10",
  "from-sky-500/40 to-blue-500/10",
];

function colorFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function MediaThumb({
  assetId,
  type = "image",
  className,
}: {
  assetId: string;
  type?: MediaAssetType;
  className?: string;
}) {
  if (type === "embed") {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md bg-sky-500/15",
          className,
        )}
      >
        <Link2 className="size-5 text-sky-400" />
      </div>
    );
  }

  if (type === "pdf") {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md bg-rose-500/15",
          className,
        )}
      >
        <FileText className="size-5 text-rose-400" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md bg-gradient-to-br",
        colorFor(assetId),
        className,
      )}
    >
      <ImageIcon className="size-5 text-white/70" />
    </div>
  );
}
