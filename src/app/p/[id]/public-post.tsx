"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Share2, UserRound } from "lucide-react";
import { platformMeta } from "@/lib/platforms";
import { PublicPostCard } from "@/components/public/public-post-card";
import { cn } from "@/lib/utils";
import type { Campaign, Session } from "@/lib/types";

function readStored(id: string): { session: Session | null; campaign: Campaign | null } {
  try {
    const sessions: Session[] = JSON.parse(localStorage.getItem("cp_sessions") || "[]");
    const campaigns: Campaign[] = JSON.parse(localStorage.getItem("cp_campaigns") || "[]");
    const session = sessions.find((s) => s.id === id) ?? null;
    const campaign = session
      ? (campaigns.find((c) => session.sentToCampaignIds.includes(c.id)) ?? null)
      : null;
    return { session, campaign };
  } catch {
    return { session: null, campaign: null };
  }
}

const NOT_SHARED_SLOTS = 18;

export default function PublicPostContent() {
  const params = useParams<{ id: string }>();
  const [{ session, campaign }] = useState(() => readStored(params.id));

  if (!session) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-1.5 p-6 text-center">
        <h1 className="text-[17px] font-semibold">This post link doesn&rsquo;t exist</h1>
        <p className="max-w-[40ch] text-pretty text-[13px] text-muted-foreground">
          The link you followed isn&rsquo;t valid, or the post has been removed.
        </p>
      </div>
    );
  }

  const platformId = campaign?.platforms[0] ?? session.platforms[0];
  const platformLabel = platformId ? platformMeta(platformId).label : "your network";
  const authorName = session.lastEditedBy?.name ?? campaign?.name ?? "Wozku";

  return (
    <div className="h-dvh overflow-y-auto [background-image:var(--wash-page)]">
      <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-10 p-8 @container lg:grid-cols-[minmax(0,440px)_1fr]">
        <div className="flex flex-col gap-5">
          <span className="text-[15px] font-semibold tracking-tight">Wozku</span>
          <p className="text-[14px] text-muted-foreground text-pretty">
            Share this post on {platformLabel} and help spread the word.
          </p>
          <button
            className="flex h-10 w-fit items-center gap-2 rounded-(--r-pill) bg-violet-600 px-4 text-[13.5px] font-medium text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15 transition-[background-color,scale] duration-150 hover:bg-violet-500 active:scale-(--press)"
          >
            <Share2 className="size-4" />
            Share on {platformLabel}
          </button>

          <PublicPostCard session={session} authorName={authorName} />
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-[17px] font-semibold">Who shared this post:</h2>
          <div className="grid grid-cols-6 gap-3">
            {Array.from({ length: NOT_SHARED_SLOTS }).map((_, i) => (
              <span
                key={i}
                title="Not shared yet"
                className={cn(
                  "flex aspect-square items-center justify-center rounded-(--r-round) bg-(--ink)/[0.05] text-muted-foreground/40 inset-ring-1 inset-ring-(--ink)/[0.08]",
                )}
              >
                <UserRound className="size-4" />
              </span>
            ))}
          </div>
          <p className="text-[12.5px] text-muted-foreground">
            Nobody has shared this yet.
          </p>
        </div>
      </div>
    </div>
  );
}
