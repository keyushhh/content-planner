"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Share2 } from "lucide-react";
import { PublicPostCard } from "@/components/public/public-post-card";
import { PublicPostTile } from "@/components/public/public-post-tile";
import { platformMeta } from "@/lib/platforms";
import { isRichTextEmpty } from "@/lib/rich-text";
import { campaignSubmitted } from "@/lib/campaigns";
import { mentionAccounts } from "@/lib/mentions";
import { avatarTint, cn } from "@/lib/utils";
import type { Campaign, Session } from "@/lib/types";

function readStored(id: string): { campaign: Campaign | null; sessions: Session[] } {
  try {
    const campaigns: Campaign[] = JSON.parse(localStorage.getItem("cp_campaigns") || "[]");
    const sessions: Session[] = JSON.parse(localStorage.getItem("cp_sessions") || "[]");
    return { campaign: campaigns.find((c) => c.id === id) ?? null, sessions };
  } catch {
    return { campaign: null, sessions: [] };
  }
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const PARTICIPANTS = mentionAccounts.filter((a) => a.kind === "person");

export default function PublicCampaignContent() {
  const params = useParams<{ id: string }>();
  const [{ campaign, sessions }] = useState(() => readStored(params.id));

  const posts = campaign
    ? campaignSubmitted(sessions, campaign)
        .slice()
        .sort(
          (a, b) =>
            new Date(b.sentAt ?? b.updatedAt).getTime() -
            new Date(a.sentAt ?? a.updatedAt).getTime(),
        )
    : [];

  const [picked, setPicked] = useState<string[]>(() => posts.map((p) => p.id));

  if (!campaign) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-1.5 p-6 text-center">
        <h1 className="text-[17px] font-semibold">This page doesn&rsquo;t exist</h1>
        <p className="max-w-[40ch] text-pretty text-[13px] text-muted-foreground">
          The link you followed isn&rsquo;t valid, or the campaign has been removed.
        </p>
      </div>
    );
  }

  function toggle(id: string) {
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const primaryPlatform = campaign.platforms[0];
  const platformLabel = primaryPlatform ? platformMeta(primaryPlatform).label : "your network";

  return (
    <div className="h-dvh overflow-y-auto [background-image:var(--wash-page)]">
      <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-10 p-8 @container lg:grid-cols-[minmax(0,440px)_1fr]">
        <div className="flex flex-col gap-5">
          <span className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            {campaign.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={campaign.logoUrl}
                alt=""
                className="size-6 shrink-0 rounded-(--r-round) object-cover"
              />
            )}
            {campaign.name}
          </span>

          {!isRichTextEmpty(campaign.description) && (
            <div
              className="rich-text -mt-2 text-[14px] leading-[1.6] text-muted-foreground text-pretty"
              dangerouslySetInnerHTML={{ __html: campaign.description }}
            />
          )}

          <button
            className="flex h-10 w-fit items-center gap-2 rounded-(--r-pill) bg-violet-600 px-4 text-[13.5px] font-medium text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15 transition-[background-color,scale] duration-150 hover:bg-violet-500 active:scale-(--press)"
          >
            <Share2 className="size-4" />
            Share on {platformLabel}
          </button>

          {posts.length === 1 ? (
            <PublicPostCard
              session={posts[0]}
              authorName={posts[0].lastEditedBy?.name ?? campaign.name}
            />
          ) : posts.length > 1 ? (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-muted-foreground">
                  Select the posts you&rsquo;d like to share
                </span>
                <span className="text-[12px] tabular-nums text-muted-foreground/60">
                  {picked.length} of {posts.length} selected
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {posts.map((post) => (
                  <PublicPostTile
                    key={post.id}
                    session={post}
                    picked={picked.includes(post.id)}
                    onToggle={() => toggle(post.id)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-muted-foreground">
              Nothing has been shared here yet.
            </p>
          )}

          {campaign.thankYou.trim() && (
            <p className="text-[12.5px] leading-snug text-muted-foreground/80 text-pretty">
              {campaign.thankYou.trim()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-[17px] font-semibold">Participants</h2>
          <div className="grid grid-cols-6 gap-3">
            {PARTICIPANTS.map((person) => (
              <span
                key={person.id}
                title={person.name}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-(--r-round) text-[13px] font-semibold inset-ring-1 inset-ring-(--ink)/[0.08]",
                  avatarTint(person.name),
                )}
              >
                {initials(person.name)}
              </span>
            ))}
          </div>
          <p className="text-[12.5px] text-muted-foreground">
            {PARTICIPANTS.length} {PARTICIPANTS.length === 1 ? "person is" : "people are"} part of
            this campaign.
          </p>
        </div>
      </div>
    </div>
  );
}
