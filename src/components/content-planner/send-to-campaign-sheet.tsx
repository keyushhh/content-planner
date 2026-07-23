"use client";

import { useState } from "react";
import { Check, Plus, Send } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/lib/types";

interface SendToCampaignSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaigns: Campaign[];
  onShare: (campaignId: string) => void;
  allowCreateCampaign?: boolean;
  onCreateCampaign?: (name: string) => string;
}

export function SendToCampaignSheet({
  open,
  onOpenChange,
  campaigns,
  onShare,
  allowCreateCampaign,
  onCreateCampaign,
}: SendToCampaignSheetProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  function reset() {
    setSelectedId(null);
    setCreating(false);
    setNewName("");
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Send to Campaign</SheetTitle>
          <SheetDescription>
            Choose a campaign to share this post to, or create a new one.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <div className="space-y-1.5">
            {campaigns.map((campaign) => {
              const isSelected = campaign.id === selectedId;
              return (
                <button
                  key={campaign.id}
                  onClick={() => setSelectedId(campaign.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border px-3.5 py-3 text-left transition-colors",
                    isSelected
                      ? "border-violet-500/60 bg-violet-500/[0.08]"
                      : "border-border hover:bg-accent/40",
                  )}
                >
                  <div>
                    <div className="text-sm font-medium">{campaign.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {campaign.sessionIds.length} sessions · Ends {campaign.endDate}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full border",
                      isSelected
                        ? "border-violet-500 bg-violet-500 text-white"
                        : "border-border",
                    )}
                  >
                    {isSelected && <Check className="size-3" />}
                  </div>
                </button>
              );
            })}
          </div>

          {allowCreateCampaign && onCreateCampaign ? (
            creating ? (
              <div className="mt-3 space-y-2.5 rounded-lg border border-violet-500/40 bg-violet-500/[0.06] p-3">
                <Input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="New campaign name…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newName.trim()) {
                      const id = onCreateCampaign(newName.trim());
                      setSelectedId(id);
                      setCreating(false);
                      setNewName("");
                    }
                  }}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setCreating(false);
                      setNewName("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={!newName.trim()}
                    className="bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40"
                    onClick={() => {
                      if (!newName.trim()) return;
                      const id = onCreateCampaign(newName.trim());
                      setSelectedId(id);
                      setCreating(false);
                      setNewName("");
                    }}
                  >
                    Create &amp; Select
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-violet-500/50 px-3.5 py-2.5 text-sm font-medium text-violet-400 transition-colors hover:bg-violet-500/10"
              >
                <Plus className="size-4" />
                Create New Campaign
              </button>
            )
          ) : (
            <button
              disabled
              title="Campaign creation happens in Wozku — coming soon"
              className="mt-3 flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3.5 py-2.5 text-sm font-medium text-muted-foreground/50 transition-colors"
            >
              <Plus className="size-4" />
              Create New Campaign
            </button>
          )}
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t border-border">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!selectedId}
            className="gap-1.5 bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40"
            onClick={() => {
              if (!selectedId) return;
              onShare(selectedId);
              onOpenChange(false);
            }}
          >
            <Send className="size-4" />
            Share
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
