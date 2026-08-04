"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, FileEdit, ImageIcon, Share2 } from "lucide-react";
import { QrGlyph } from "@/components/public/qr-glyph";
import { ScreenBackdrop } from "@/components/public/screen-backdrop";
import { platformMeta } from "@/lib/platforms";
import { isRichTextEmpty } from "@/lib/rich-text";
import { endsLabel, platformsOf } from "@/lib/campaigns";
import { formatFollowers } from "@/lib/mentions";
import { mockCount } from "@/lib/mock-engagement";
import { screenThemeVars } from "@/lib/screen-theme";
import { cn } from "@/lib/utils";
import type { Campaign, MediaAsset, Session } from "@/lib/types";

export function CampaignScreen({
  campaign,
  posts,
  mediaAssets,
  interactive = true,
  now,
}: {
  campaign: Campaign;
  posts: Session[];
  mediaAssets: MediaAsset[];
  interactive?: boolean;
  now?: number;
}) {
  const theme = campaign.theme;
  const [page, setPage] = useState(1);
  const [mountedAt] = useState(() => Date.now());

  const primaryPlatform = campaign.platforms[0];
  const platformLabel = primaryPlatform ? platformMeta(primaryPlatform).label : "your network";
  const ends = endsLabel(campaign.endDate, now ?? mountedAt);

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedPosts = posts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div
      style={screenThemeVars(theme)}
      className="relative isolate min-h-full bg-(--screen-bg) font-(family-name:--screen-font) text-(--screen-ink)"
    >
      <ScreenBackdrop theme={theme} />

      <div className="relative mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-6 pt-10 pb-16">
        <div
          className={cn(
            "grid grid-cols-1 items-start gap-6",
            posts.length > 0 && "lg:grid-cols-[minmax(0,380px)_1fr]",
          )}
        >
          <div className="flex flex-col gap-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.11em] text-(--screen-accent)">
              Advocacy Campaign
            </span>

            <h1 className="-mt-2 flex flex-wrap items-center gap-3 text-[30px] font-semibold leading-tight tracking-[-0.025em] text-balance">
              {campaign.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={campaign.logoUrl}
                  alt=""
                  className="size-9 shrink-0 rounded-[10px] object-cover ring-1 ring-(--screen-line)"
                />
              )}
              {campaign.name || "Untitled campaign"}
            </h1>

            <p className="flex flex-wrap items-center gap-2 text-[13px] text-(--screen-muted)">
              {campaign.tag && (
                <span className="rounded-[6px] bg-(--screen-panel) px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-[0.06em]">
                  {campaign.tag}
                </span>
              )}
              <span className="tabular-nums">
                {posts.length} {posts.length === 1 ? "post" : "posts"}
              </span>
              <span className="opacity-40">&middot;</span>
              <span>{ends.date}</span>
              {ends.soon && (
                <>
                  <span className="opacity-40">&middot;</span>
                  <span className="text-(--screen-accent)">{ends.soon}</span>
                </>
              )}
            </p>

            <div className="flex flex-wrap items-center gap-1.5">
              {platformsOf(campaign).map((id) => (
                <span
                  key={id}
                  className="flex h-[22px] items-center rounded-full bg-(--screen-panel) px-2.5 text-[10.5px] font-medium ring-1 ring-(--screen-line)"
                >
                  {platformMeta(id).label}
                </span>
              ))}
            </div>

            <button
              type="button"
              disabled={!interactive}
              className="mt-1 flex h-10 w-fit items-center gap-2 rounded-full bg-(--screen-accent) px-5 text-[13px] font-semibold text-(--screen-accent-ink) transition-[filter,scale] duration-150 hover:brightness-110 active:scale-[0.97] disabled:pointer-events-none"
            >
              <Share2 className="size-4" />
              Share Campaign
            </button>
          </div>

          {posts.length > 0 && (
            <div className="grid h-full grid-cols-1 items-stretch overflow-hidden rounded-[18px] bg-(--screen-panel) ring-1 ring-(--screen-line) sm:grid-cols-2">
              <div className="flex min-w-0 flex-col justify-center px-6 py-6">
                <h2 className="text-[16px] font-semibold tracking-tight">
                  Help us spread the word.
                </h2>
                {!isRichTextEmpty(campaign.description) ? (
                  <div
                    className="rich-text mt-1.5 text-[12.5px] leading-[1.55] text-(--screen-muted) text-pretty"
                    dangerouslySetInnerHTML={{ __html: campaign.description }}
                  />
                ) : (
                  <p className="mt-1.5 text-[12.5px] leading-[1.55] text-(--screen-muted) text-pretty">
                    Share {campaign.name} with your network on {platformLabel} and help it
                    reach more people.
                  </p>
                )}
              </div>
              <div
                aria-hidden
                className="hidden items-center justify-center bg-white px-6 py-7 sm:flex"
              >
                <QrGlyph
                  seed={campaign.id}
                  className="aspect-square w-full max-w-[152px] text-neutral-900"
                />
              </div>
            </div>
          )}
        </div>

        {posts.length > 0 && <StatStrip campaignId={campaign.id} posts={posts.length} />}

        {posts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[18px] bg-(--screen-panel) px-6 py-12 text-center ring-1 ring-(--screen-line)">
            <span className="flex size-10 items-center justify-center rounded-full bg-(--screen-panel-strong) text-(--screen-muted)">
              <FileEdit className="size-4.5" />
            </span>
            <p className="text-[13.5px] font-medium">Nothing shared yet</p>
            <p className="max-w-[38ch] text-[12.5px] text-(--screen-muted) text-pretty">
              Check back soon. Posts from this campaign will show up here as soon as they go
              out.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.11em] text-(--screen-muted)">
                All posts
              </span>
              <span className="text-[12px] tabular-nums text-(--screen-muted)">
                {posts.length} total
              </span>
            </div>
            <div className="flex flex-col rounded-[18px] bg-(--screen-panel) px-2 ring-1 ring-(--screen-line) [&>*+*]:border-t [&>*+*]:border-(--screen-line)">
              {pagedPosts.map((post) => (
                <PostRow
                  key={post.id}
                  post={post}
                  mediaAssets={mediaAssets}
                  interactive={interactive}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-1 flex items-center justify-end">
                <nav
                  aria-label="Pagination"
                  className="flex items-center gap-0.5 rounded-full bg-(--screen-panel) p-1 ring-1 ring-(--screen-line)"
                >
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!interactive || safePage === 1}
                    aria-label="Previous page"
                    className="flex size-8 items-center justify-center rounded-full text-(--screen-muted) transition-colors duration-150 hover:bg-(--screen-panel-strong) disabled:opacity-35"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="px-2 text-[12px] font-medium tabular-nums">
                    {safePage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={!interactive || safePage === totalPages}
                    aria-label="Next page"
                    className="flex size-8 items-center justify-center rounded-full text-(--screen-muted) transition-colors duration-150 hover:bg-(--screen-panel-strong) disabled:opacity-35"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </nav>
              </div>
            )}
          </div>
        )}

        {campaign.thankYou.trim() && (
          <p className="text-[12.5px] leading-snug text-(--screen-muted) text-pretty">
            {campaign.thankYou.trim()}
          </p>
        )}
      </div>
    </div>
  );
}

function StatStrip({ campaignId, posts }: { campaignId: string; posts: number }) {
  const stats = [
    { label: "Shares", value: mockCount(`shares-${campaignId}`, 40, 900).toLocaleString() },
    { label: "Reach", value: formatFollowers(mockCount(`reach-${campaignId}`, 2000, 90000)) },
    { label: "Advocates", value: mockCount(`people-${campaignId}`, 6, 120).toLocaleString() },
    { label: "Posts", value: String(posts) },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-[14px] bg-(--screen-panel) px-4 py-3 ring-1 ring-(--screen-line)"
        >
          <span className="block text-[10.5px] font-semibold uppercase tracking-[0.09em] text-(--screen-muted)">
            {stat.label}
          </span>
          <span className="mt-1 block text-[21px] font-semibold tabular-nums tracking-[-0.02em]">
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function PostRow({
  post,
  mediaAssets,
  interactive,
}: {
  post: Session;
  mediaAssets: MediaAsset[];
  interactive: boolean;
}) {
  const image = post.visualAssetIds
    .map((id) => mediaAssets.find((a) => a.id === id))
    .find((a): a is MediaAsset => Boolean(a) && a!.type === "image");
  const shares = mockCount(post.id, 8, 210);
  const reach = mockCount(`reach-${post.id}`, 400, 18000);

  const body = (
    <>
      <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-(--screen-panel-strong) text-(--screen-muted)">
        {image?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.url} alt="" className="size-full object-cover" />
        ) : (
          <ImageIcon className="size-5" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block line-clamp-2 text-[13.5px] font-medium">
          {post.copy.trim() || <span className="italic text-(--screen-muted)">No copy yet.</span>}
        </span>
      </span>

      <span className="hidden shrink-0 flex-col items-end gap-0.5 text-right sm:flex">
        <span className="text-[13px] font-medium tabular-nums">{shares} shares</span>
        <span className="text-[11px] tabular-nums text-(--screen-muted)">
          {formatFollowers(reach)} reach
        </span>
      </span>

      <span className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-(--screen-accent) px-3 text-[12px] font-semibold text-(--screen-accent-ink)">
        <Share2 className="size-3.5" />
        Share
      </span>
    </>
  );

  const className =
    "group flex items-center gap-3 p-3 transition-colors duration-150 hover:bg-(--screen-panel-strong)";

  return interactive ? (
    <Link href={`/p/${post.id}`} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
