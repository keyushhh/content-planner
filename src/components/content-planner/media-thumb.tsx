import { cn } from "@/lib/utils";
import { ImageIcon, Link2, FileText } from "lucide-react";
import type { MediaAssetType } from "@/lib/types";

const THEMES: Record<string, { bg: string; border: string; iconBg: string; textColor: string; label: string }> = {
  png: {
    bg: "from-violet-950/50 to-purple-900/20",
    border: "border-violet-500/30",
    iconBg: "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30",
    textColor: "text-violet-300/80",
    label: "PNG IMAGE",
  },
  jpg: {
    bg: "from-emerald-950/50 to-teal-900/20",
    border: "border-emerald-500/30",
    iconBg: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30",
    textColor: "text-emerald-300/80",
    label: "JPG IMAGE",
  },
  embed: {
    bg: "from-sky-950/50 to-blue-900/20",
    border: "border-sky-500/30",
    iconBg: "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30",
    textColor: "text-sky-300/80",
    label: "WEB EMBED",
  },
  pdf: {
    bg: "from-rose-950/50 to-red-900/20",
    border: "border-rose-500/30",
    iconBg: "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30",
    textColor: "text-rose-300/80",
    label: "PDF DOC",
  },
};

export function MediaThumb({
  assetId,
  type = "image",
  className,
}: {
  assetId: string;
  type?: MediaAssetType;
  className?: string;
}) {
  const isEmbed = type === "embed";
  const isPdf = type === "pdf";

  const key = isEmbed ? "embed" : isPdf ? "pdf" : assetId.includes("logo") ? "png" : "jpg";
  const theme = THEMES[key] || THEMES.png;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl bg-gradient-to-br border p-3 text-center transition-all",
        theme.bg,
        theme.border,
        className
      )}
    >
      <div className={cn("flex size-11 items-center justify-center rounded-xl shadow-inner", theme.iconBg)}>
        {isEmbed ? (
          <Link2 className="size-5" />
        ) : isPdf ? (
          <FileText className="size-5" />
        ) : (
          <ImageIcon className="size-5" />
        )}
      </div>
      <span className={cn("mt-2 text-[10px] font-semibold uppercase tracking-wider", theme.textColor)}>
        {theme.label}
      </span>
    </div>
  );
}
