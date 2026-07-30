"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  FileEdit,
  LayoutGrid,
  List,
  Megaphone,
  PlusCircle,
  Search,
  TableProperties,
  Image as ImageIcon,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Stagger } from "@/components/content-planner/session-composer";
import { CampaignContextMenu } from "./campaign-context-menu";
import {
  CAMPAIGN_STATE,
  campaignDrafts,
  campaignState,
  campaignSubmitted,
  endsLabel,
  platformsOf,
} from "@/lib/campaigns";
import { platformMeta } from "@/lib/platforms";
import { cn } from "@/lib/utils";
import type { Campaign, CampaignState, Session } from "@/lib/types";
import { CampaignGalleryCard } from "./campaign-gallery-card";
import { CampaignListItem } from "./campaign-list-item";
import { CampaignTable } from "./campaign-table";

const FILTERS: { id: CampaignState | "all"; label: string }[] = [
  { id: "all", label: "All campaigns" },
  { id: "live", label: "Live" },
  { id: "draft", label: "Draft" },
  { id: "ended", label: "Ended" },
];

export function CampaignsView({
  campaigns,
  sessions,
  onOpenCampaign,
  onNewCampaign,
}: {
  campaigns: Campaign[];
  sessions: Session[];
  onOpenCampaign: (id: string) => void;
  onNewCampaign: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CampaignState | "all">("all");
  const [viewType, setViewType] = useState<"cards" | "gallery" | "list" | "table">("table");
  const [now] = useState(() => Date.now());

  // Load saved view preference
  useEffect(() => {
    const saved = localStorage.getItem("wozku:campaigns-view");
    if (saved && ["cards", "gallery", "list", "table"].includes(saved)) {
      setViewType(saved as any);
    }
  }, []);

  function handleViewChange(type: typeof viewType) {
    setViewType(type);
    localStorage.setItem("wozku:campaigns-view", type);
  }

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return campaigns
      .map((campaign) => ({
        campaign,
        state: campaignState(campaign, now),
        drafts: campaignDrafts(sessions, campaign.id).length,
        submitted: campaignSubmitted(sessions, campaign).length,
      }))
      .filter((row) => (filter === "all" ? true : row.state === filter))
      .filter((row) =>
        q
          ? row.campaign.name.toLowerCase().includes(q) ||
            row.campaign.tag.toLowerCase().includes(q)
          : true,
      );
  }, [campaigns, sessions, filter, search, now]);

  const waiting = useMemo(
    () =>
      campaigns.reduce(
        (total, c) => total + campaignDrafts(sessions, c.id).length,
        0,
      ),
    [campaigns, sessions],
  );

  const filtered = search.trim().length > 0 || filter !== "all";

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-6 pb-16">
        <div className="shrink-0 pb-6 pt-6">
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.025em] text-balance">
            Campaigns
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
            Where content goes out. Every campaign needs a post before it can go live.
            {waiting > 0 && (
              <>
                <span className="text-muted-foreground/30">&middot;</span>
                <span className="flex items-center gap-1.5 text-amber-300/90">
                  <FileEdit className="size-3" />
                  <span className="tabular-nums">{waiting}</span> waiting for approval
                </span>
              </>
            )}
          </p>
        </div>

        <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2.5">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <div className="relative min-w-[240px] max-w-[260px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search campaigns…"
                aria-label="Search campaigns"
                className="h-8 w-full rounded-(--r-pill) bg-(--ink)/[0.06] pl-8 pr-8 text-[13px] caret-violet-400 inset-ring-1 inset-ring-(--ink)/[0.10] outline-none transition-[box-shadow,background-color] duration-200 placeholder:text-muted-foreground/75 focus:bg-(--ink)/[0.085] focus:inset-ring-violet-400/50"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-(--r-pill) text-muted-foreground transition-colors hover:bg-(--ink)/[0.08] hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    title="Filter by state"
                    className={cn(
                      "flex h-8 w-[148px] items-center gap-1.5 rounded-(--r-pill) px-3 text-[13px] font-medium inset-ring-1 transition-[background-color,box-shadow,color,scale] duration-150 active:scale-(--press)",
                      filter !== "all"
                        ? "bg-violet-500/[0.16] text-violet-100 inset-ring-violet-400/45"
                        : "bg-(--ink)/[0.035] text-muted-foreground inset-ring-(--ink)/[0.08] hover:text-foreground",
                    )}
                  />
                }
              >
                <CalendarDays className="size-3.5 shrink-0" />
                <span className="flex-1 truncate text-left">
                  {FILTERS.find((f) => f.id === filter)!.label}
                </span>
                <ChevronDown className="size-3.5 shrink-0 opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[148px]">
                {FILTERS.map(({ id, label }) => (
                  <DropdownMenuItem key={id} onClick={() => setFilter(id)}>
                    <span className="flex-1 whitespace-nowrap">{label}</span>
                    {filter === id && <Check className="size-3.5 text-violet-300" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="flex items-center gap-1">
              <ViewToggle active={viewType === "table"} onClick={() => handleViewChange("table")} icon={TableProperties} title="Table" />
              <ViewToggle active={viewType === "cards"} onClick={() => handleViewChange("cards")} icon={LayoutGrid} title="Cards" />
              <ViewToggle active={viewType === "gallery"} onClick={() => handleViewChange("gallery")} icon={ImageIcon} title="Gallery" />
              <ViewToggle active={viewType === "list"} onClick={() => handleViewChange("list")} icon={List} title="List" />
            </div>

            <button
              onClick={onNewCampaign}
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-(--r-pill) bg-violet-600 px-3.5 text-[13px] font-medium text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15 transition-[background-color,scale] duration-150 hover:bg-violet-500 active:scale-(--press)"
            >
              <PlusCircle className="size-4" />
              New campaign
            </button>
          </div>
        </div>

        {rows.length === 0 ? (
          <Stagger
            index={0}
            className="flex flex-1 flex-col items-center justify-center gap-2 rounded-(--r-surface) bg-(--surface-raised) px-8 py-20 text-center shadow-(--lift-md) inset-ring-1 inset-ring-(--ink)/[0.07]"
          >
            <span className="flex size-11 items-center justify-center rounded-(--r-pill) bg-violet-500/10 text-violet-300 inset-ring-1 inset-ring-violet-400/25">
              <Megaphone className="size-5" />
            </span>
            <span className="mt-2 text-[15px] font-semibold tracking-tight">
              {filtered ? "No matches" : "No campaigns yet"}
            </span>
            <span className="max-w-[420px] text-[13px] text-muted-foreground text-pretty">
              {filtered
                ? "Nothing here fits that search. Try a different term or clear the filter."
                : "A campaign is the push you are writing for. Make one, send posts to it from the repository, and take it live."}
            </span>
            {filtered ? (
              <button
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                className="mt-4 flex h-9 items-center rounded-(--r-pill) bg-(--ink)/[0.04] px-3.5 text-[13px] font-medium inset-ring-1 inset-ring-(--ink)/[0.09] transition-[background-color,scale] duration-150 hover:bg-(--ink)/[0.07] active:scale-(--press)"
              >
                Clear filters
              </button>
            ) : (
              <button
                onClick={onNewCampaign}
                className="mt-4 flex h-9 items-center gap-1.5 rounded-(--r-pill) bg-violet-600 px-4 text-[13px] font-medium text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15 transition-[background-color,scale] duration-150 hover:bg-violet-500 active:scale-(--press)"
              >
                <PlusCircle className="size-4" />
                New campaign
              </button>
            )}
          </Stagger>
        ) : viewType === "table" ? (
          <Stagger index={0} className="w-full">
            <CampaignTable rows={rows} now={now} onOpen={onOpenCampaign} />
          </Stagger>
        ) : viewType === "list" ? (
          <div className="flex flex-col gap-2">
            {rows.map((row, i) => (
              <Stagger key={row.campaign.id} index={Math.min(i, 7)}>
                <CampaignListItem
                  {...row}
                  now={now}
                  onOpen={() => onOpenCampaign(row.campaign.id)}
                />
              </Stagger>
            ))}
          </div>
        ) : viewType === "gallery" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {rows.map((row, i) => (
              <Stagger key={row.campaign.id} index={Math.min(i, 7)}>
                <CampaignGalleryCard
                  {...row}
                  now={now}
                  onOpen={() => onOpenCampaign(row.campaign.id)}
                />
              </Stagger>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((row, i) => (
              <Stagger key={row.campaign.id} index={Math.min(i, 7)}>
                <CampaignCard
                  {...row}
                  now={now}
                  onOpen={() => onOpenCampaign(row.campaign.id)}
                />
              </Stagger>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

function CampaignCard({
  campaign,
  state,
  drafts,
  submitted,
  now,
  onOpen,
}: {
  campaign: Campaign;
  state: CampaignState;
  drafts: number;
  submitted: number;
  now: number;
  onOpen: () => void;
}) {
  const tone = CAMPAIGN_STATE[state];
  const ends = endsLabel(campaign.endDate, now);
  const needsPost = state === "draft" && submitted === 0;

  return (
    <button
      onClick={onOpen}
      className="group flex h-full w-full flex-col overflow-hidden rounded-(--r-surface) bg-(--surface-raised) text-left shadow-(--lift-sm) inset-ring-1 inset-ring-(--ink)/[0.07] transition-[box-shadow,background-color,scale] duration-200 hover:shadow-(--lift-md) hover:inset-ring-(--ink)/[0.12] active:scale-[0.995]"
    >
      <span
        aria-hidden
        className="h-px w-full shrink-0 [background-image:var(--specular)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <span className="flex min-w-0 flex-1 flex-col px-4 pb-3.5 pt-4">
        <span className="flex min-w-0 items-start justify-between gap-2">
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold tracking-[-0.01em]">
              {campaign.name}
            </span>
            <span className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="shrink-0 rounded-(--r-inner) bg-(--ink)/[0.06] px-1.5 py-px text-[9.5px] font-semibold font-(family-name:--font-label) uppercase tracking-[0.06em] text-muted-foreground/85">
                {campaign.tag}
              </span>
              <span className="truncate">{ends.date}</span>
              {ends.soon && (
                <>
                  <span aria-hidden className="shrink-0 text-muted-foreground/30">
                    ·
                  </span>
                  <span className="shrink-0 text-amber-300/80">{ends.soon}</span>
                </>
              )}
            </span>
          </span>

          <span
            className={cn(
              "flex h-6 shrink-0 items-center gap-1.5 rounded-(--r-pill) px-2 text-[10.5px] font-medium inset-ring-1",
              tone.chip,
            )}
          >
            <span aria-hidden className={cn("size-1.5 rounded-(--r-round)", tone.dot)} />
            {tone.label}
          </span>
        </span>
      </span>

      <span className="flex shrink-0 items-center justify-between border-t border-(--ink)/[0.06] bg-(--ink)/[0.02] px-4 py-2.5">
        <span className="flex flex-1 items-center gap-1">
          {platformsOf(campaign).map((id) => {
            const meta = platformMeta(id);
            return (
              <span
                key={id}
                className={cn(
                  "flex size-[18px] items-center justify-center rounded-full inset-ring-1",
                  meta.tint,
                )}
                title={meta.label}
              >
                <span aria-hidden className={cn("size-1 rounded-full", meta.dot)} />
              </span>
            );
          })}
        </span>

        <span className="flex items-center justify-end gap-3">
          <span className="flex items-center gap-2">
            {drafts > 0 && (
              <span className="flex items-center gap-1 text-[10.5px] font-medium text-amber-300/90">
                <FileEdit className="size-3 shrink-0" />
                <span className="tabular-nums">{drafts}</span> waiting
              </span>
            )}
            <span className="flex items-center gap-1 text-muted-foreground">
              <span className="text-[11.5px] font-medium tabular-nums text-foreground/80">{submitted}</span>
              <span className="text-[10.5px]">posts</span>
            </span>
          </span>
          <CampaignContextMenu onOpen={onOpen} />
        </span>
      </span>
    </button>
  );
};

function ViewToggle({
  active,
  onClick,
  icon: Icon,
  title,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "flex h-7 w-8 items-center justify-center rounded-[calc(var(--r-pill)-2px)] transition-all duration-200 active:scale-95",
        active
          ? "bg-background text-foreground shadow-(--lift-sm) inset-ring-1 inset-ring-(--ink)/[0.08]"
          : "text-muted-foreground hover:bg-(--ink)/[0.04] hover:text-foreground",
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );
}
