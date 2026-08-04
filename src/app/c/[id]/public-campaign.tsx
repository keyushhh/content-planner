"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Pause } from "lucide-react";
import { CampaignScreen } from "@/components/public/campaign-screen";
import { campaignState, publicScreenPosts } from "@/lib/campaigns";
import { mediaAssets as staticMediaAssets } from "@/lib/mock-data";
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

export default function PublicCampaignContent() {
  const params = useParams<{ id: string }>();
  const [{ campaign, sessions }] = useState(() => readStored(params.id));
  const [now] = useState(() => Date.now());

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

  if (campaignState(campaign, now) === "paused") {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-1.5 p-6 text-center">
        <span className="mb-1.5 flex size-11 items-center justify-center rounded-(--r-round) bg-sky-500/[0.10] text-sky-300 inset-ring-1 inset-ring-sky-400/25">
          <Pause className="size-5" />
        </span>
        <h1 className="text-[17px] font-semibold">This campaign is paused</h1>
        <p className="max-w-[42ch] text-pretty text-[13px] text-muted-foreground">
          {campaign.name} is taking a short break. Check back soon &mdash; it will be
          right here when it returns.
        </p>
      </div>
    );
  }

  return (
    <div className="h-dvh overflow-y-auto">
      <CampaignScreen
        campaign={campaign}
        posts={publicScreenPosts(sessions, campaign)}
        mediaAssets={staticMediaAssets}
        now={now}
      />
    </div>
  );
}
