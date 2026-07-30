"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  FileEdit,
  PlusCircle,
  Search,
  X,
} from "lucide-react";
import { CampaignForm } from "./campaign-form";
import { StatusBadge } from "@/components/content-planner/status-badge";
import { missingFields } from "@/lib/campaigns";
import { cn } from "@/lib/utils";
import type { Campaign, MediaAsset, NewCampaign, Session } from "@/lib/types";

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
      <WizardHeader step={state.step} onCancel={onCancel} />
      {state.step === 1 && (
        <Step1Setup
          initial={initialDraft}
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
          onToggle={(id) => {
            const next = state.postIds.includes(id)
              ? state.postIds.filter((x) => x !== id)
              : [...state.postIds, id];
            onStateChange({ ...state, postIds: next });
          }}
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
          onGoToCampaign={() => onGoToCampaign(state.campaignId!)}
          onAddAnother={() => onStateChange({ ...state, step: 2, postIds: [] })}
          onBackToRepository={onBackToRepository}
        />
      )}
    </div>
  );
}

function WizardHeader({ step, onCancel }: { step: number; onCancel: () => void }) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-4 border-b border-(--ink)/[0.06] px-6 py-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {step === 1 && (
          <button
            onClick={onCancel}
            className="flex h-8 items-center rounded-(--r-pill) px-3 text-[13px] font-medium text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground active:scale-(--press)"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <StepPill num={1} label="Campaign setup" active={step === 1} done={step > 1} />
        <span className="h-px w-4 bg-(--ink)/[0.08]" />
        <StepPill num={2} label="Add posts" active={step === 2} done={step > 2} />
        <span className="h-px w-4 bg-(--ink)/[0.08]" />
        <StepPill num={3} label="Completed" active={step === 3} done={step > 3} />
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end" />
    </div>
  );
}

function StepPill({
  num,
  label,
  active,
  done,
}: {
  num: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-(--r-pill) px-2.5 py-1 text-[12px] font-medium transition-colors duration-200",
        active
          ? "bg-violet-500/[0.12] text-violet-600 inset-ring-1 inset-ring-violet-400/25"
          : done
            ? "text-foreground/80"
            : "text-muted-foreground/60",
      )}
    >
      {done ? (
        <span className="flex size-4 items-center justify-center rounded-(--r-round) bg-emerald-500 text-white">
          <Check className="size-2.5" strokeWidth={3} />
        </span>
      ) : (
        <span
          className={cn(
            "flex size-4 items-center justify-center rounded-(--r-round) text-[10px] font-bold",
            active ? "bg-violet-600 text-white" : "bg-(--ink)/[0.10]",
          )}
        >
          {num}
        </span>
      )}
      {label}
    </div>
  );
}

function Step1Setup({
  initial,
  onContinue,
}: {
  initial: NewCampaign;
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
      />
      <div className="absolute bottom-6 right-6 flex items-center gap-3 rounded-(--r-float) bg-background/95 p-2 shadow-(--lift-lg) backdrop-blur-md inset-ring-1 inset-ring-(--ink)/[0.08]">
        {touched && !ready && (
          <span className="flex items-center gap-1.5 pl-2 text-[11.5px] text-amber-500">
            <AlertCircle className="size-3.5 shrink-0" />
            {missing.length} required fields remaining
          </span>
        )}
        <button
          onClick={advance}
          className={cn(
            "flex h-9 items-center gap-1.5 rounded-(--r-pill) px-5 text-[13px] font-medium transition-[background-color,box-shadow,scale,opacity] duration-200 active:scale-(--press)",
            ready
              ? "bg-violet-600 text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15 hover:bg-violet-500"
              : "bg-violet-600/40 text-white/80 opacity-80",
          )}
        >
          Continue
          <ArrowRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function Step2AddPosts({
  sessions,
  selectedIds,
  onToggle,
  onWriteNewPost,
  onContinue,
}: {
  sessions: Session[];
  selectedIds: string[];
  onToggle: (id: string) => void;
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

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden [background-image:var(--wash-page)]">
      <div className="mx-auto flex w-full max-w-[800px] flex-1 flex-col overflow-hidden px-6 pb-16 pt-12">
        <div className="mb-8 text-center">
          <h2 className="text-[24px] font-semibold tracking-tight">Add posts</h2>
          <p className="mt-1.5 text-[14px] text-muted-foreground">
            A campaign stays a draft until it has at least one post. Select posts to add
            them to this campaign as drafts waiting for approval.
          </p>
        </div>

        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="relative min-w-[240px] max-w-[320px] flex-1">
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
          <button
            onClick={onWriteNewPost}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-(--r-pill) bg-(--ink)/[0.035] px-3.5 text-[13px] font-medium inset-ring-1 inset-ring-(--ink)/[0.08] transition-[background-color,scale] hover:bg-(--ink)/[0.06] active:scale-(--press)"
          >
            <PlusCircle className="size-4 text-violet-400/80" />
            Write a new post
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-(--r-surface) bg-(--surface-raised) shadow-(--lift-sm) inset-ring-1 inset-ring-(--ink)/[0.07]">
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
                        <StatusBadge status={s.status} />
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 flex shrink-0 items-center justify-between">
          <span className="text-[13px] text-muted-foreground">
            {count === 0
              ? "You can always add posts later."
              : `${count} ${count === 1 ? "post" : "posts"} selected`}
          </span>
          <button
            onClick={onContinue}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-(--r-pill) px-5 text-[13px] font-medium transition-[background-color,box-shadow,scale] duration-200 active:scale-(--press)",
              count > 0
                ? "bg-violet-600 text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15 hover:bg-violet-500"
                : "bg-(--ink)/[0.05] inset-ring-1 inset-ring-(--ink)/[0.08] hover:bg-(--ink)/[0.08]",
            )}
          >
            {count > 0 ? "Continue" : "Skip for now"}
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Step3Completed({
  campaign,
  postCount,
  onGoToCampaign,
  onAddAnother,
  onBackToRepository,
}: {
  campaign: Campaign;
  postCount: number;
  onGoToCampaign: () => void;
  onAddAnother: () => void;
  onBackToRepository: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const url = `https://wozku.com/c/${campaign.id}`;

  function handleCopy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
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
  );
}
