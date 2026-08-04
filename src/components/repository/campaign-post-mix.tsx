"use client";

import type { PostType, Session } from "@/lib/types";

/* Fixed categorical order — a post type keeps its colour no matter which types are present. */
const POST_TYPE_TINT: Record<PostType, { bar: string; label: string; text: string }> = {
  Image: { bar: "bg-violet-400", label: "bg-violet-500/[0.09]", text: "text-violet-300" },
  Frames: { bar: "bg-sky-400", label: "bg-sky-500/[0.09]", text: "text-sky-300" },
  PDF: { bar: "bg-amber-400", label: "bg-amber-500/[0.09]", text: "text-amber-300" },
  Reshare: { bar: "bg-fuchsia-400", label: "bg-fuchsia-500/[0.09]", text: "text-fuchsia-300" },
};

const ORDER: PostType[] = ["Image", "Frames", "PDF", "Reshare"];

export function CampaignPostMix({ sessions }: { sessions: Pick<Session, "postType">[] }) {
  if (sessions.length === 0) return null;

  const counts = ORDER.map((type) => ({
    type,
    count: sessions.filter((s) => s.postType === type).length,
  })).filter((row) => row.count > 0);

  /* A single type is 100% of itself — nothing to compare, so nothing to show. */
  if (counts.length < 2) return null;

  return (
    <div className="mb-6 flex shrink-0 flex-col gap-4 rounded-(--r-surface) bg-(--surface-raised) p-5 shadow-(--lift-sm) inset-ring-1 inset-ring-(--ink)/[0.08] sm:flex-row sm:gap-8">
      {counts.map(({ type, count }) => {
        const tint = POST_TYPE_TINT[type];
        const pct = Math.round((count / sessions.length) * 100);
        return (
          <div key={type} className="min-w-0 flex-1">
            <span
              className={`inline-flex items-center gap-1.5 rounded-(--r-pill) px-2 py-0.5 text-[10.5px] font-medium ${tint.label} ${tint.text}`}
            >
              {type}
            </span>
            <span className="mt-2 block text-[20px] font-semibold leading-none tracking-[-0.02em] tabular-nums">
              {pct}%
            </span>
            <div
              role="img"
              aria-label={`${type}: ${pct}% of posts in this campaign`}
              className="mt-3 h-1.5 w-full overflow-hidden rounded-(--r-pill) bg-(--ink)/[0.06]"
            >
              <div
                className={`h-full rounded-(--r-pill) ${tint.bar}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
