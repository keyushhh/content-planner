"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Copy, EyeOff, Gift, Star, Users } from "lucide-react";
import { platformMeta } from "@/lib/platforms";
import { PublicPostCard } from "@/components/public/public-post-card";
import { ShareButton } from "@/components/public/share-button";
import { SocialProofStack } from "@/components/public/social-proof-stack";
import {
  campaignState,
  isHiddenOnScreen,
  isSubmittedIn,
  publicScreenPosts,
} from "@/lib/campaigns";
import { mentionAccounts } from "@/lib/mentions";
import { mockCount } from "@/lib/mock-engagement";
import { cn, relativeTime, tagTint } from "@/lib/utils";
import type { Campaign, Session } from "@/lib/types";

function readStored(id: string): {
  session: Session | null;
  campaign: Campaign | null;
  sessions: Session[];
} {
  try {
    const sessions: Session[] = JSON.parse(localStorage.getItem("cp_sessions") || "[]");
    const campaigns: Campaign[] = JSON.parse(localStorage.getItem("cp_campaigns") || "[]");
    const session = sessions.find((s) => s.id === id) ?? null;
    const campaign = session
      ? (campaigns.find((c) => isSubmittedIn(session, c)) ?? null)
      : null;
    return { session, campaign, sessions };
  } catch {
    return { session: null, campaign: null, sessions: [] };
  }
}

const PARTICIPANT_POOL = mentionAccounts.filter((a) => a.kind === "person");

export default function PublicPostContent() {
  const params = useParams<{ id: string }>();
  const [{ session, campaign, sessions }] = useState(() => readStored(params.id));
  const [copied, setCopied] = useState(false);

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

  /* A post is only public while its campaign is: pausing the campaign or toggling the post
     off in Screen Setup has to close this link too, or hiding it would mean nothing. */
  const unavailable =
    campaign &&
    (campaignState(campaign) === "paused" || isHiddenOnScreen(campaign, session.id));

  if (unavailable) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-1.5 p-6 text-center">
        <span className="mb-1.5 flex size-11 items-center justify-center rounded-(--r-round) bg-sky-500/[0.10] text-sky-300 inset-ring-1 inset-ring-sky-400/25">
          <EyeOff className="size-5" />
        </span>
        <h1 className="text-[17px] font-semibold">This post isn&rsquo;t available</h1>
        <p className="max-w-[42ch] text-pretty text-[13px] text-muted-foreground">
          It has been taken off {campaign?.name ?? "the campaign"}&rsquo;s screen for now.
          Check back soon.
        </p>
      </div>
    );
  }

  const platformId = campaign?.platforms[0] ?? session.platforms[0];
  const platformMetaValue = platformId ? platformMeta(platformId) : null;
  const platformLabel = platformMetaValue?.label ?? "your network";
  const authorName = session.lastEditedBy?.name ?? campaign?.name ?? "Wozku";
  const tag = session.tags[0];

  /* Siblings follow the screen, so "next post" never offers something hidden. */
  const campaignPosts = campaign ? publicScreenPosts(sessions, campaign) : [];
  const postIndex = campaignPosts.findIndex((p) => p.id === session.id);

  const proofCount = mockCount(session.id, 3, 40);
  const proofPeople = Array.from({ length: proofCount }, (_, i) => {
    const base = PARTICIPANT_POOL[i % PARTICIPANT_POOL.length];
    return { id: `${base.id}-${i}`, name: base.name };
  });

  function handleCopyCaption() {
    navigator.clipboard.writeText(session!.copy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="h-dvh overflow-y-auto [background-image:var(--wash-page)]">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 p-6 pt-8 pb-12 sm:p-8 sm:pt-10">
        {campaign && (
          <div className="flex items-center justify-between">
            <Link
              href={`/c/${campaign.id}`}
              className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Back to {campaign.name}
            </Link>
            {campaignPosts.length > 1 && postIndex !== -1 && (
              <span className="text-[12px] tabular-nums text-muted-foreground/70">
                Post {postIndex + 1} of {campaignPosts.length}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {tag && (
            <span
              className={cn(
                "w-fit rounded-(--r-pill) px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.04em]",
                tagTint(tag),
              )}
            >
              {tag}
            </span>
          )}

          <span className="text-[11px] font-semibold font-(family-name:--font-label) uppercase tracking-[0.09em] text-muted-foreground/70">
            {campaign ? "From the campaign" : "Shared post"}
          </span>

          <h1 className="-mt-2 flex flex-wrap items-center gap-2.5 text-[28px] font-semibold leading-tight tracking-[-0.025em] text-balance">
            {campaign?.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={campaign.logoUrl}
                alt=""
                className="size-8 shrink-0 rounded-(--r-inner) object-cover inset-ring-1 inset-ring-(--ink)/[0.1]"
              />
            )}
            {campaign?.name ?? authorName}
          </h1>

          <p className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
            <span>Posted by {authorName}</span>
            {session.sentAt && (
              <>
                <span className="text-muted-foreground/30">&middot;</span>
                <span>{relativeTime(session.sentAt)}</span>
              </>
            )}
          </p>

          {platformMetaValue && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  "flex h-[22px] items-center gap-1.5 rounded-(--r-pill) px-2 text-[10.5px] font-medium inset-ring-1",
                  platformMetaValue.tint,
                )}
              >
                <span aria-hidden className={cn("size-1 rounded-(--r-round)", platformMetaValue.dot)} />
                {platformMetaValue.label}
              </span>
            </div>
          )}

          <button
            onClick={handleCopyCaption}
            className="flex h-10 w-fit items-center gap-2 rounded-(--r-pill) bg-(--ink)/[0.04] px-4 text-[13px] font-medium text-foreground/85 inset-ring-1 inset-ring-(--ink)/[0.09] transition-[background-color,scale] duration-150 hover:bg-(--ink)/[0.07] active:scale-(--press)"
          >
            {copied ? (
              <Check className="size-4 text-emerald-400" />
            ) : (
              <Copy className="size-4" />
            )}
            {copied ? "Copied" : "Copy caption"}
          </button>
        </div>

        <div className="flex w-full max-w-[480px] flex-col gap-3 self-center">
          <span className="text-[11px] font-semibold font-(family-name:--font-label) uppercase tracking-[0.09em] text-muted-foreground/70">
            LinkedIn Preview
          </span>

          <PublicPostCard session={session} authorName={authorName} />

          <ShareButton platformLabel={platformLabel} className="w-full justify-center" />
          <p className="text-center text-[11.5px] text-muted-foreground/70">
            You&rsquo;ll be redirected to {platformLabel} to share.
          </p>

          <div className="mt-1 grid grid-cols-3 gap-2 rounded-(--r-surface) bg-(--ink)/[0.03] p-4 text-center inset-ring-1 inset-ring-(--ink)/[0.06]">
            <div className="flex flex-col items-center gap-1.5">
              <Star className="size-4 text-violet-300" />
              <span className="text-[11px] leading-snug text-muted-foreground">
                Earns you recognition
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Users className="size-4 text-violet-300" />
              <span className="text-[11px] leading-snug text-muted-foreground">
                Helps the mission
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Gift className="size-4 text-violet-300" />
              <span className="text-[11px] leading-snug text-muted-foreground">
                Unlocks perks
              </span>
            </div>
          </div>

          <SocialProofStack
            people={proofPeople}
            caption={`${proofCount} ${proofCount === 1 ? "person has" : "people have"} shared this post.`}
            emptyCaption="Nobody has shared this post yet — be the first."
          />
        </div>
      </div>
    </div>
  );
}
