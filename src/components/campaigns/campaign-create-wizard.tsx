"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  PlusCircle,
  Search,
  X,
} from "lucide-react";
import { CampaignForm } from "./campaign-form";
import { StatusBadge } from "@/components/content-planner/status-badge";
import { missingFields } from "@/lib/campaigns";
import { cn } from "@/lib/utils";
import type { Campaign, NewCampaign, Session } from "@/lib/types";

export type CampaignWizardState = {
  step: 1 | 2 | 3;
  campaignId: string | null;
  postIds: string[];
};

export function CampaignCreateWizard({
  state,
  initialDraft,
  sessions,
  campaigns,
  onStateChange,
  onCancel,
  onCreateCampaign,
  onStageDrafts,
  onWriteNewPost,
  onGoToCampaign,
  onBackToRepository,
}: {
  state: CampaignWizardState;
  initialDraft: NewCampaign;
  sessions: Session[];
  campaigns: Campaign[];
  onStateChange: (next: CampaignWizardState) => void;
  onCancel: () => void;
  onCreateCampaign: (draft: NewCampaign) => string;
  onStageDrafts: (campaignId: string, postIds: string[]) => void;
  onWriteNewPost: () => void;
  onGoToCampaign: (id: string) => void;
  onBackToRepository: () => void;
}) {
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-background">
      {state.step === 1 && (
        <Step1Setup
          initial={initialDraft}
          onCancel={onCancel}
          onContinue={(draft) => {
            const id = onCreateCampaign(draft);
            onStateChange({ ...state, step: 2, campaignId: id });
          }}
        />
      )}
      {state.step === 2 && (
        <Step2AddPosts
          sessions={sessions}
          selectedIds={state.postIds}
          onBack={() => onStateChange({ ...state, step: 1 })}
          onToggle={(id) => {
            const next = state.postIds.includes(id)
              ? state.postIds.filter((x) => x !== id)
              : [...state.postIds, id];
            onStateChange({ ...state, postIds: next });
          }}
          onSelectAll={(nextIds) => onStateChange({ ...state, postIds: nextIds })}
          onWriteNewPost={onWriteNewPost}
          onContinue={() => {
            if (state.campaignId && state.postIds.length > 0) {
              onStageDrafts(state.campaignId, state.postIds);
            }
            onStateChange({ ...state, step: 3 });
          }}
        />
      )}
      {state.step === 3 && (
        <Step3Completed
          campaign={campaigns.find((c) => c.id === state.campaignId)!}
          postCount={state.postIds.length}
          onClose={() => onGoToCampaign(state.campaignId!)}
          onGoToCampaign={() => onGoToCampaign(state.campaignId!)}
          onAddAnother={() => onStateChange({ ...state, step: 2, postIds: [] })}
          onBackToRepository={onBackToRepository}
        />
      )}
    </div>
  );
}

const WIZARD_STEPS = ["Setup", "Posts", "Complete"];

function WizardHeader({
  step,
  onCancel,
  onBack,
  rightAction,
}: {
  step: number;
  onCancel?: () => void;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}) {
  return (
    <div className="flex shrink-0 border-b border-(--ink)/[0.06] bg-background">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4 px-6 py-3.5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {onBack ? (
            <button
              onClick={onBack}
              aria-label="Back"
              className="flex size-8 shrink-0 items-center justify-center rounded-(--r-pill) text-muted-foreground transition-colors hover:bg-(--ink)/[0.06] hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
            </button>
          ) : onCancel ? (
            <button
              onClick={onCancel}
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-(--r-pill) bg-(--ink)/[0.03] py-1 pl-2.5 pr-3.5 text-[13px] font-medium text-muted-foreground inset-ring-1 inset-ring-(--ink)/[0.08] transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive hover:inset-ring-destructive/25"
            >
              <X className="size-3.5" />
              Cancel
            </button>
          ) : null}
        </div>

        <ol
          className="flex items-center"
          aria-label={`Step ${step} of 3: ${WIZARD_STEPS[step - 1]}`}
        >
          {WIZARD_STEPS.map((label, i) => {
            const s = i + 1;
            const done = s < step;
            const active = s === step;
            return (
              <li key={label} className="flex items-center">
                {i > 0 && (
                  <span
                    aria-hidden
                    className={cn(
                      "mx-2 h-px w-7 shrink-0 transition-colors duration-300",
                      s <= step ? "bg-violet-500/40" : "bg-(--ink)/[0.10]",
                    )}
                  />
                )}
                <span className="flex items-center gap-1.5" aria-current={active ? "step" : undefined}>
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full text-[10.5px] font-semibold transition-[background-color,color,box-shadow] duration-300",
                      done
                        ? "bg-violet-500/90 text-white"
                        : active
                          ? "bg-violet-600 text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15"
                          : "bg-(--ink)/[0.05] text-muted-foreground/50 inset-ring-1 inset-ring-(--ink)/[0.10]",
                    )}
                  >
                    {done ? <Check className="size-3" strokeWidth={3} /> : s}
                  </span>
                  <span
                    className={cn(
                      "text-[13px] font-medium tracking-tight transition-colors duration-300",
                      active
                        ? "text-foreground"
                        : done
                          ? "text-foreground/55"
                          : "text-muted-foreground/45",
                    )}
                  >
                    {label}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>

        <div className="flex min-w-0 flex-1 items-center justify-end">
          {rightAction}
        </div>
      </div>
    </div>
  );
}

function Step1Setup({
  initial,
  onCancel,
  onContinue,
}: {
  initial: NewCampaign;
  onCancel: () => void;
  onContinue: (draft: NewCampaign) => void;
}) {
  const [draft, setDraft] = useState<NewCampaign>(initial);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const missing = missingFields(draft);
  const ready = missing.length === 0;

  function advance() {
    if (!ready) {
      setTouched(true);
      return;
    }
    onContinue(draft);
  }

  return (
    <>
      <WizardHeader step={1} onCancel={onCancel} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden relative">
        <CampaignForm
          draft={draft}
          missing={missing}
          touched={touched}
          onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
          onSettingsChange={(patch) =>
            setDraft((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }))
          }
          error={error}
          onError={setError}
          onDismissError={() => setError(null)}
          footer={
            <button
              onClick={advance}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-(--r-pill) px-6 text-[13.5px] font-medium transition-[background-color,box-shadow,opacity,scale] duration-200 active:scale-(--press)",
                ready
                  ? "bg-violet-600 text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15 hover:bg-violet-500"
                  : "bg-violet-600/40 text-white/80 opacity-80",
              )}
            >
              Continue
            </button>
          }
        />
      </div>
    </>
  );
}

function Step2AddPosts({
  sessions,
  selectedIds,
  onBack,
  onToggle,
  onSelectAll,
  onWriteNewPost,
  onContinue,
}: {
  sessions: Session[];
  selectedIds: string[];
  onBack: () => void;
  onToggle: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onWriteNewPost: () => void;
  onContinue: () => void;
}) {
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    return sessions.filter((s) =>
      q ? s.title.toLowerCase().includes(q) || s.copy.toLowerCase().includes(q) : true,
    );
  }, [sessions, q]);

  const count = selectedIds.length;
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((s) => selectedIds.includes(s.id));

  function toggleSelectAll() {
    if (allFilteredSelected) {
      // Unselect all filtered
      const filteredIds = new Set(filtered.map((s) => s.id));
      onSelectAll(selectedIds.filter((id) => !filteredIds.has(id)));
    } else {
      // Select all filtered
      const newSelected = Array.from(new Set([...selectedIds, ...filtered.map((s) => s.id)]));
      onSelectAll(newSelected);
    }
  }

  return (
    <>
      <WizardHeader step={2} onBack={onBack} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden [background-image:var(--wash-page)] relative">
        <div className="mx-auto flex w-full max-w-[800px] flex-1 flex-col overflow-y-auto px-6 pb-28 pt-8">
          <div className="mb-6 text-center">
            <h2 className="text-[24px] font-semibold tracking-tight">Add posts</h2>
            <p className="mt-1.5 text-[14px] text-muted-foreground">
              A campaign stays a draft until it has at least one post. Select posts to add
              them to this campaign as drafts waiting for approval.
            </p>
          </div>

          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-[360px]">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search posts…"
                  className="h-9 w-full rounded-(--r-pill) bg-(--ink)/[0.035] pl-8 pr-8 text-[13px] caret-violet-400 inset-ring-1 inset-ring-(--ink)/[0.08] outline-none transition-[box-shadow,background-color] duration-200 placeholder:text-muted-foreground/75 focus:bg-(--ink)/[0.06] focus:inset-ring-violet-400/50"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-(--r-pill) text-muted-foreground hover:bg-(--ink)/[0.08] hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              {filtered.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="flex h-9 shrink-0 items-center gap-1.5 rounded-(--r-pill) bg-(--ink)/[0.035] px-3 text-[12.5px] font-medium text-foreground/80 inset-ring-1 inset-ring-(--ink)/[0.08] transition-all hover:bg-(--ink)/[0.06] active:scale-95"
                >
                  <span
                    className={cn(
                      "flex size-3.5 items-center justify-center rounded-[3px] inset-ring-1 transition-colors",
                      allFilteredSelected
                        ? "bg-violet-500 text-white inset-ring-violet-400"
                        : "inset-ring-(--ink)/[0.3]",
                    )}
                  >
                    {allFilteredSelected && <Check className="size-2.5" strokeWidth={3} />}
                  </span>
                  <span>{allFilteredSelected ? "Deselect all" : "Select all"}</span>
                </button>
              )}
            </div>

            <button
              onClick={onWriteNewPost}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-(--r-pill) bg-(--ink)/[0.035] px-3.5 text-[13px] font-medium inset-ring-1 inset-ring-(--ink)/[0.08] transition-[background-color,scale] hover:bg-(--ink)/[0.06] active:scale-(--press)"
            >
              <PlusCircle className="size-4 text-violet-400/80" />
              Write a new post
            </button>
          </div>

          <div className="rounded-(--r-surface) bg-(--surface-raised) shadow-(--lift-sm) inset-ring-1 inset-ring-(--ink)/[0.07]">
            {filtered.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-center text-[13px] text-muted-foreground">
                {q ? "No posts match that search." : "No posts found in the repository."}
              </div>
            ) : (
              <div className="flex flex-col">
                {filtered.map((s) => {
                  const checked = selectedIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => onToggle(s.id)}
                      className={cn(
                        "group flex items-center gap-3 border-b border-(--ink)/[0.05] p-3 text-left transition-colors hover:bg-(--ink)/[0.02] last:border-b-0",
                        checked && "bg-violet-500/[0.04]",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-[4px] transition-colors inset-ring-1",
                          checked
                            ? "bg-violet-500 text-white inset-ring-violet-400"
                            : "inset-ring-(--ink)/[0.2] group-hover:inset-ring-(--ink)/40",
                        )}
                      >
                        <Check
                          className={cn(
                            "size-2.5 transition-[opacity,scale]",
                            checked ? "scale-100 opacity-100" : "scale-50 opacity-0",
                          )}
                          strokeWidth={3}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium">
                          {s.title || "Untitled post"}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span>{s.postType}</span>
                          <span aria-hidden>·</span>
                          <StatusBadge status={s.status} hint={false} />
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-(--ink)/[0.06] bg-background/90 p-4 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-[800px] items-center justify-between px-6">
            <span className="text-[13px] font-medium text-muted-foreground">
              {count === 0
                ? "You can always add posts later."
                : `${count} ${count === 1 ? "post" : "posts"} selected`}
            </span>
            <button
              onClick={onContinue}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-(--r-pill) px-6 text-[13.5px] font-medium transition-[background-color,box-shadow,opacity,scale] duration-200 active:scale-(--press)",
                count > 0
                  ? "bg-violet-600 text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15 hover:bg-violet-500"
                  : "bg-(--ink)/[0.05] text-foreground inset-ring-1 inset-ring-(--ink)/[0.08] hover:bg-(--ink)/[0.08]",
              )}
            >
              {count > 0 ? "Continue" : "Skip"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Step3Completed({
  campaign,
  postCount,
  onClose,
  onGoToCampaign,
  onAddAnother,
  onBackToRepository,
}: {
  campaign: Campaign;
  postCount: number;
  onClose: () => void;
  onGoToCampaign: () => void;
  onAddAnother: () => void;
  onBackToRepository: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const path = `/c/${campaign.id}`;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}${path}`;

  function handleCopy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <WizardHeader
        step={3}
        rightAction={
          <button
            onClick={onClose}
            className="flex h-8 items-center gap-1.5 rounded-(--r-pill) bg-(--ink)/[0.05] px-3.5 text-[13px] font-medium text-foreground inset-ring-1 inset-ring-(--ink)/[0.08] transition-[background-color,box-shadow,opacity] duration-200 hover:bg-(--ink)/[0.08] active:scale-(--press)"
          >
            Done
          </button>
        }
      />
      <div className="flex flex-1 flex-col items-center justify-center [background-image:var(--wash-page)] p-6">
        <div className="flex w-full max-w-[480px] flex-col items-center text-center">
          <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 inset-ring-1 inset-ring-emerald-500/20 shadow-(--lift-md)">
            <Check className="size-8" strokeWidth={2.5} />
          </div>
          <h2 className="mb-2 text-[24px] font-semibold tracking-tight">
            Campaign created
          </h2>
          <p className="mb-8 text-[14.5px] text-muted-foreground text-pretty">
            Your campaign <strong className="font-medium text-foreground">{campaign.name}</strong> has been created.
            {postCount > 0
              ? ` ${postCount} ${postCount === 1 ? "post has" : "posts have"} been attached and are waiting for approval.`
              : " It currently has no posts attached."}
          </p>

          <div className="mb-8 w-full rounded-(--r-surface) bg-(--surface-raised) p-5 shadow-(--lift-sm) inset-ring-1 inset-ring-(--ink)/[0.07] text-left">
            <span className="mb-1.5 block text-[11px] font-semibold font-(family-name:--font-label) uppercase tracking-[0.09em] text-muted-foreground/70">
              Public landing page
            </span>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={url}
                className="h-9 min-w-0 flex-1 rounded-(--r-inner) bg-(--ink)/[0.03] px-3 text-[13px] text-muted-foreground inset-ring-1 inset-ring-(--ink)/[0.08] outline-none"
              />
              <a
                href={path}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-(--r-pill) bg-(--ink)/[0.04] px-3.5 text-[12px] font-medium inset-ring-1 inset-ring-(--ink)/[0.09] transition-[background-color,scale] hover:bg-(--ink)/[0.07] active:scale-(--press)"
              >
                <ExternalLink className="size-3.5" />
                Open
              </a>
              <button
                onClick={handleCopy}
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-(--r-pill) bg-(--ink)/[0.04] px-3.5 text-[12px] font-medium inset-ring-1 inset-ring-(--ink)/[0.09] transition-[background-color,scale] hover:bg-(--ink)/[0.07] active:scale-(--press)"
              >
                {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2">
            <button
              onClick={onGoToCampaign}
              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-(--r-pill) bg-violet-600 px-4 text-[13.5px] font-medium text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15 transition-[background-color,scale] duration-150 hover:bg-violet-500 active:scale-(--press)"
            >
              Go to the campaign
            </button>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={onAddAnother}
                className="flex h-9 flex-1 items-center justify-center rounded-(--r-pill) bg-(--ink)/[0.03] px-4 text-[13px] font-medium inset-ring-1 inset-ring-(--ink)/[0.08] transition-[background-color,scale] hover:bg-(--ink)/[0.06] active:scale-(--press)"
              >
                Add another post
              </button>
              <button
                onClick={onBackToRepository}
                className="flex h-9 flex-1 items-center justify-center rounded-(--r-pill) bg-(--ink)/[0.03] px-4 text-[13px] font-medium inset-ring-1 inset-ring-(--ink)/[0.08] transition-[background-color,scale] hover:bg-(--ink)/[0.06] active:scale-(--press)"
              >
                Back to repository
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
