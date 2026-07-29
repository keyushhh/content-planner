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

/**
 * `compact` is the composer's reading. The full tile packs a 44px icon well
 * and an uppercase "PNG IMAGE" caption into whatever box it is given, and at
 * the 80px the composer uses that is a cramped label under an oversized icon.
 */
export function MediaThumb({
  assetId,
  type = "image",
  compact = false,
  url,
  name,
  className,
}: {
  assetId: string;
  type?: MediaAssetType;
  compact?: boolean;
  /** The real picture, when there is one. Mock assets have none. */
  url?: string;
  name?: string;
  className?: string;
}) {
  const isEmbed = type === "embed";
  const isPdf = type === "pdf";

  // An actual image beats any placeholder: the glyph tiles exist because the
  // seeded assets carry no file, not because a thumbnail should be an icon.
  if (url && type === "image") {
    return (
      // blob: URLs from a local file pick, which next/image cannot optimise and
      // must not be handed.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name ?? "Asset preview"}
        draggable={false}
        className={cn("rounded-xl bg-(--ink)/[0.03] object-cover", className)}
      />
    );
  }

  /**
   * A PDF gets its first page, not a document glyph. `<object>` does something
   * an `<img>` cannot: the browser's own PDF renderer draws the page, and if
   * it has none, the fallback children render instead, so the glyph tile is
   * the automatic backstop.
   */
  if (url && isPdf) {
    return (
      <div
        title={name ?? "PDF"}
        className={cn(
          "relative overflow-hidden rounded-xl bg-(--surface-well)",
          className,
        )}
      >
        <object
          data={`${url}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
          type="application/pdf"
          aria-label={name ?? "PDF preview"}
          className="pointer-events-none absolute left-0 top-0 h-[200%] w-[200%] origin-top-left scale-50 border-0"
        >
          <span className="flex size-full items-center justify-center text-muted-foreground">
            <FileText className="size-5" />
          </span>
        </object>
        {/* Says which format without a caption stealing a line of the tile */}
        <span className="absolute bottom-0 right-0 rounded-tl-md bg-black/70 px-1 py-px text-[8px] font-semibold uppercase tracking-wider text-(--ink)/80">
          pdf
        </span>
      </div>
    );
  }

  const key = isEmbed ? "embed" : isPdf ? "pdf" : assetId.includes("logo") ? "png" : "jpg";
  const theme = THEMES[key] || THEMES.png;

  const Glyph = isEmbed ? Link2 : isPdf ? FileText : ImageIcon;

  if (compact) {
    return (
      <div
        title={theme.label}
        className={cn(
          "flex items-center justify-center rounded-xl bg-(--ink)/[0.05] text-muted-foreground",
          className,
        )}
      >
        <Glyph className="size-5" />
      </div>
    );
  }

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
