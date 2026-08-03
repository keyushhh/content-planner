"use client";

import { useState } from "react";
import { Check, Link2, PenLine, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CampaignContextMenu({
  campaignId,
  onOpen,
}: {
  campaignId: string;
  onOpen: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/c/${campaignId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked by permissions — nothing useful to fall back to.
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            onClick={(e) => e.stopPropagation()}
            aria-label="Campaign options"
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-(--ink)/[0.06] hover:text-foreground/90 active:scale-95"
          >
            <MoreHorizontal className="size-4" />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            copyLink();
          }}
        >
          {copied ? (
            <Check className="mr-2 size-4 text-live-300" />
          ) : (
            <Link2 className="mr-2 size-4 opacity-70" />
          )}
          <span>{copied ? "Link copied" : "Copy public link"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          <PenLine className="mr-2 size-4 opacity-70" />
          <span>Edit campaign</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
