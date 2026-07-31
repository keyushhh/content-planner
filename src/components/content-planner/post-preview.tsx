"use client";

import { useState } from "react";
import {
  FileText,
  Globe,
  MessageSquare,
  Repeat2,
  Send,
  ThumbsUp,
} from "lucide-react";
import { cn, avatarTint } from "@/lib/utils";
import { MediaThumb } from "./media-thumb";
import type { MediaAsset, Session } from "@/lib/types";

const CLAMP_AT = 320;

export function PostPreview({
  session,
  copy,
  mediaAssets,
  authorName,
  className,
}: {
  session: Session;
  copy?: string;
  mediaAssets: MediaAsset[];
  authorName: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const body = (copy ?? session.copy).trim();
  const tags = session.hashtags.trim();
  const full = tags ? `${body}\n\n${tags}` : body;
  const long = full.length > CLAMP_AT;
  const shown = long && !expanded ? `${full.slice(0, CLAMP_AT).trimEnd()}…` : full;

  const assets = session.visualAssetIds
    .map((id) => mediaAssets.find((a) => a.id === id))
    .filter((a): a is MediaAsset => Boolean(a));

  return (
    <div
      className={cn(
        "overflow-hidden rounded-(--r-surface) bg-(--surface-raised) shadow-(--lift-md) inset-ring-1 inset-ring-(--ink)/[0.08]",
        className,
      )}
    >
      <div className="flex items-start gap-2.5 px-4 pb-2.5 pt-4">
        <span
          aria-hidden
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-(--r-round) text-[13px] font-semibold inset-ring-1 inset-ring-(--ink)/[0.07]",
            avatarTint(authorName),
          )}
        >
          {authorName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase() ?? "")
            .join("")}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-semibold leading-tight">
            {authorName}
          </span>
          <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">
            Content lead
          </span>
          <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground/70">
            Now
            <span aria-hidden className="text-muted-foreground/40">
              ·
            </span>
            <Globe className="size-3" />
          </span>
        </span>
      </div>

      {full ? (
        <div className="px-4 pb-3">
          <p className="whitespace-pre-line text-[13.5px] leading-[1.55] text-foreground/90 text-pretty">
            {highlight(shown)}
          </p>
          {long && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
              className="mt-1 text-[12.5px] font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              {expanded ? "see less" : "see more"}
            </button>
          )}
        </div>
      ) : (
        <p className="px-4 pb-3 text-[13px] italic text-muted-foreground/60">
          No copy yet.
        </p>
      )}

      <PreviewMedia session={session} assets={assets} />

      <div className="flex items-center justify-between gap-1 border-t border-(--ink)/[0.06] px-2 py-1.5">
        {[
          { icon: ThumbsUp, label: "Like" },
          { icon: MessageSquare, label: "Comment" },
          { icon: Repeat2, label: "Repost" },
          { icon: Send, label: "Send" },
        ].map(({ icon: Icon, label }) => (
          <span
            key={label}
            aria-hidden
            className="flex flex-1 items-center justify-center gap-1.5 rounded-(--r-inner) py-1.5 text-[11.5px] font-medium text-muted-foreground/70"
          >
            <Icon className="size-3.5" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function PreviewMedia({
  session,
  assets,
}: {
  session: Session;
  assets: MediaAsset[];
}) {
  if (session.postType === "Reshare") {
    return (
      <div className="mx-4 mb-3 overflow-hidden rounded-(--r-inner) inset-ring-1 inset-ring-(--ink)/[0.10]">
        <div className="flex items-center gap-2 px-3 pb-1.5 pt-2.5">
          <span
            aria-hidden
            className="size-6 shrink-0 rounded-(--r-round) bg-(--ink)/[0.08]"
          />
          <span className="min-w-0">
            <span className="block truncate text-[11.5px] font-semibold">
              The original post
            </span>
            <span className="block truncate text-[10.5px] text-muted-foreground">
              Its copy and media come along on the reshare
            </span>
          </span>
        </div>
        <div className="flex h-24 items-center justify-center bg-(--ink)/[0.04] text-muted-foreground/50">
          <Repeat2 className="size-5" />
        </div>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="mx-4 mb-3 flex h-32 items-center justify-center rounded-(--r-inner) bg-(--ink)/[0.03] text-[12px] text-muted-foreground/60 inset-ring-1 inset-ring-(--ink)/[0.07]">
        {session.postType === "PDF"
          ? "No document attached yet"
          : "No image attached yet"}
      </div>
    );
  }

  if (session.postType === "PDF") {
    const doc = assets[0];
    return (
      <div className="mb-3 border-y border-(--ink)/[0.06] bg-(--ink)/[0.02]">
        <div className="relative aspect-[4/3] w-full">
          <MediaThumb
            assetId={doc.id}
            type={doc.type}
            url={doc.url}
            name={doc.name}
            className="size-full !rounded-none"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5">
          <FileText className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">
            {doc.name}
          </span>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            Swipe as pages
          </span>
        </div>
      </div>
    );
  }

  if (session.postType === "Frames" && assets.length > 1) {
    return (
      <div className="mb-3">
        <div className="relative aspect-square w-full border-y border-(--ink)/[0.06]">
          <MediaThumb
            assetId={assets[0].id}
            type={assets[0].type}
            url={assets[0].url}
            name={assets[0].name}
            className="size-full !rounded-none"
          />
          <span className="absolute right-3 top-3 rounded-(--r-pill) bg-black/65 px-2 py-0.5 text-[10.5px] font-semibold tabular-nums text-white backdrop-blur-sm">
            1/{assets.length}
          </span>
        </div>
        <div className="flex items-center justify-center gap-1.5 pt-2">
          {assets.map((asset, i) => (
            <span
              key={asset.id}
              aria-hidden
              className={cn(
                "h-1.5 rounded-(--r-pill) transition-colors duration-200",
                i === 0 ? "w-4 bg-(--ink)/45" : "w-1.5 bg-(--ink)/[0.18]",
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3 aspect-[1.91/1] w-full border-y border-(--ink)/[0.06]">
      <MediaThumb
        assetId={assets[0].id}
        type={assets[0].type}
        url={assets[0].url}
        name={assets[0].name}
        className="size-full !rounded-none"
      />
    </div>
  );
}

function highlight(text: string) {
  return text.split(/(@[A-Za-z0-9._]+|#[A-Za-z0-9_]+)/g).map((part, i) =>
    part.startsWith("@") || part.startsWith("#") ? (
      <span key={i} className="font-medium text-sky-300">
        {part}
      </span>
    ) : (
      part
    ),
  );
}
