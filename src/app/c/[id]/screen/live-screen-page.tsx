"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { LiveScreen, LiveScreenControls } from "@/components/public/live-screen";
import { campaignState, publicScreenPosts } from "@/lib/campaigns";
import { activeMoments, type MomentId } from "@/lib/screen-theme";
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

export default function LiveScreenContent() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const only = search.get("only") as MomentId | null;
  const [{ campaign, sessions }] = useState(() => readStored(params.id));
  const [running, setRunning] = useState(true);
  const [pinned, setPinned] = useState<MomentId | null>(null);

  const moments = useMemo(
    () => (campaign ? activeMoments(campaign.theme) : []),
    [campaign],
  );

  const step = useCallback(
    (delta: 1 | -1) => {
      if (moments.length === 0) return;
      setRunning(false);
      setPinned((current) => {
        const at = current ? moments.findIndex((m) => m.id === current) : 0;
        const next = (at + delta + moments.length) % moments.length;
        return moments[next].id;
      });
    },
    [moments],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " ") {
        e.preventDefault();
        setRunning((r) => !r);
      }
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  if (!campaign) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-1.5 bg-black p-6 text-center text-white">
        <h1 className="text-[17px] font-semibold">This screen doesn&rsquo;t exist</h1>
        <p className="max-w-[40ch] text-pretty text-[13px] text-white/60">
          The link you followed isn&rsquo;t valid, or the campaign has been removed.
        </p>
      </div>
    );
  }

  if (campaignState(campaign) === "paused") {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-1.5 bg-black p-6 text-center text-white">
        <h1 className="text-[17px] font-semibold">This campaign is paused</h1>
        <p className="max-w-[42ch] text-pretty text-[13px] text-white/60">
          {campaign.name} is taking a short break. Resume it to bring the screen back.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      <LiveScreen
        campaign={campaign}
        posts={publicScreenPosts(sessions, campaign)}
        mediaAssets={staticMediaAssets}
        momentId={only ?? pinned ?? undefined}
        running={running && !pinned}
      />
      {!only && (
      <LiveScreenControls
        running={running && !pinned}
        onToggle={() => {
          setPinned(null);
          setRunning((r) => (pinned ? true : !r));
        }}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
      />
      )}
    </div>
  );
}
