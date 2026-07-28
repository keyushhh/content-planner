"use client";

import { Plus, PanelLeftClose, PanelLeftOpen, Layers, CalendarClock, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/lib/types";

interface CampaignSidebarProps {
  campaigns: Campaign[];
  selectedCampaignId: string;
  onSelectCampaign: (id: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const ACCENTS = [
  "from-violet-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-rose-500",
  "from-sky-500 to-blue-500",
];

function accentFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return ACCENTS[Math.abs(hash) % ACCENTS.length];
}

export function CampaignSidebar({
  campaigns,
  selectedCampaignId,
  onSelectCampaign,
  collapsed,
  onToggleCollapsed,
}: CampaignSidebarProps) {
  if (collapsed) {
    return (
      <div className="flex h-full w-12 shrink-0 flex-col items-center border-r border-border bg-card/40 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onToggleCollapsed}
          aria-label="Expand campaigns sidebar"
        >
          <PanelLeftOpen className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-r border-border bg-card/40">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-semibold tracking-tight">
            Content Planner
          </span>
          <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-normal text-muted-foreground">
            Beta
          </Badge>
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="size-7" aria-label="New campaign">
            <Plus className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onToggleCollapsed}
            aria-label="Collapse campaigns sidebar"
          >
            <PanelLeftClose className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-2.5">
        {campaigns.map((campaign) => {
          const isSelected = campaign.id === selectedCampaignId;
          return (
            <button
              key={campaign.id}
              onClick={() => onSelectCampaign(campaign.id)}
              className={cn(
                "group relative flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all",
                isSelected
                  ? "bg-accent/70 ring-1 ring-border"
                  : "hover:bg-accent/40",
              )}
            >
              <span
                className={cn(
                  "absolute inset-y-2 left-0 w-0.5 rounded-full bg-gradient-to-b transition-opacity",
                  accentFor(campaign.id),
                  isSelected ? "opacity-100" : "opacity-0",
                )}
              />
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-bold text-white",
                  accentFor(campaign.id),
                )}
              >
                {campaign.name.slice(0, 2).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="truncate text-sm font-semibold">
                    {campaign.name}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge
                      variant="outline"
                      className="border-violet-500/40 bg-violet-500/10 px-1.5 py-0 text-[10px] uppercase text-violet-400"
                    >
                      {campaign.tag}
                    </Badge>
                    {isSelected && (
                      <span
                        title="Campaign Setup (redirects to Wozku campaign setup)"
                        className="flex size-5 items-center justify-center rounded-md text-muted-foreground/80 hover:bg-violet-500/20 hover:text-violet-300"
                      >
                        <Pencil className="size-3" />
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 tabular-nums">
                    <Layers className="size-3" />
                    {campaign.sessionIds.length}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarClock className="size-3" />
                    {campaign.endDate}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
