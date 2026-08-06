"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, Download, ExternalLink, Link2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Segmented } from "@/components/repository/theme-controls";
import { PRIMARY_ACTION, SECONDARY_ACTION_SM } from "@/lib/button-styles";
import { absoluteUrl, postLinks, qrFileName } from "@/lib/post-links";
import { cn } from "@/lib/utils";
import type { Session } from "@/lib/types";

/* A code has to be dark-on-light to scan reliably, whatever the app's theme is doing. */
const QR_OPTIONS = {
  margin: 1,
  color: { dark: "#0b0b0f", light: "#ffffff" },
} as const;

interface PostLinksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
}

export function PostLinksDialog({ open, onOpenChange, session }: PostLinksDialogProps) {
  const links = session ? postLinks(session) : [];
  const [linkId, setLinkId] = useState(links[0]?.id ?? "public");
  const [copied, setCopied] = useState(false);
  const [svg, setSvg] = useState("");

  const active = links.find((link) => link.id === linkId) ?? links[0] ?? null;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = active ? absoluteUrl(origin, active.path) : "";

  /* Reset to the public link each time it opens: that is the one people want most often. */
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setLinkId(links[0]?.id ?? "public");
      setCopied(false);
    }
  }

  useEffect(() => {
    if (!open || !url) return;
    let live = true;
    QRCode.toString(url, { ...QR_OPTIONS, type: "svg", width: 320 }).then((markup) => {
      if (live) setSvg(markup);
    });
    return () => {
      live = false;
    };
  }, [open, url]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function downloadQr(format: "png" | "svg") {
    if (!session || !active) return;
    const name = `${qrFileName(session.title || "untitled post", active.label)}.${format}`;

    const href =
      format === "png"
        ? await QRCode.toDataURL(url, { ...QR_OPTIONS, width: 1024 })
        : URL.createObjectURL(
            new Blob([await QRCode.toString(url, { ...QR_OPTIONS, type: "svg" })], {
              type: "image/svg+xml",
            }),
          );

    const link = document.createElement("a");
    link.href = href;
    link.download = name;
    link.click();
    if (format === "svg") URL.revokeObjectURL(href);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(460px,calc(100vw-2rem))] gap-0 bg-(--surface-canvas) p-0 sm:max-w-[min(460px,calc(100vw-2rem))]">
        <div className="flex flex-col gap-1 border-b border-(--ink)/[0.06] px-5 py-4 pr-12">
          <DialogTitle className="truncate text-[15px] font-semibold tracking-[-0.01em]">
            {session?.title || "Untitled post"}
          </DialogTitle>
          <span className="text-[11.5px] text-muted-foreground">
            Links and QR codes for this post.
          </span>
        </div>

        {active && (
          <div className="flex flex-col gap-4 p-5">
            {links.length > 1 && (
              <Segmented
                value={linkId}
                options={links.map((link) => ({ value: link.id, label: link.label }))}
                onChange={setLinkId}
              />
            )}

            <p className="text-center text-[11.5px] leading-snug text-muted-foreground/80 text-pretty">
              {active.blurb}
            </p>

            <div className="flex flex-col items-center gap-3">
              <div className="rounded-(--r-surface) bg-white p-3 shadow-(--lift-lg)">
                <div
                  aria-label={`QR code for ${active.label}`}
                  className="size-[172px] [&>svg]:size-full"
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button onClick={() => downloadQr("png")} className={SECONDARY_ACTION_SM}>
                  <Download className="size-3" />
                  PNG
                </button>
                <button onClick={() => downloadQr("svg")} className={SECONDARY_ACTION_SM}>
                  <Download className="size-3" />
                  SVG
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 rounded-(--r-float) bg-(--ink)/[0.04] py-1.5 pl-3 pr-1.5 inset-ring-1 inset-ring-(--ink)/[0.06]">
              <Link2 className="size-3.5 shrink-0 text-muted-foreground/50" />
              <span title={url} className="min-w-0 flex-1 truncate text-[12px] text-foreground/85">
                {url}
              </span>
              <a
                href={active.path}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open in a new tab"
                className="flex size-7 shrink-0 items-center justify-center rounded-(--r-pill) text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.08] hover:text-foreground active:scale-(--press)"
              >
                <ExternalLink className="size-3.5" />
              </a>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(url);
                setCopied(true);
              }}
              className={cn(PRIMARY_ACTION, "w-full justify-center")}
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Link copied" : "Copy link"}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
