"use client";

import { useMemo, useRef, useState } from "react";
import { Calculator, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { inputClass } from "@/components/campaigns/campaign-form";
import { formatFollowers } from "@/lib/mentions";
import { mockCount } from "@/lib/mock-engagement";
import { cn, formatCurrency } from "@/lib/utils";
import type { Campaign } from "@/lib/types";

interface RoiSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign;
}

// A typical campaign should open on a modest positive, not a loss.
const DEFAULTS = { spend: "1200", perShare: "12", perClick: "0.85" };

// Rejects "-" and "e" outright, so the parsed value can never be negative or exponential.
const MONEY = /^\d{0,9}(\.\d{0,2})?$/;

function num(raw: string): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function RoiSheet({ open, onOpenChange, campaign }: RoiSheetProps) {
  const [spend, setSpend] = useState(DEFAULTS.spend);
  const [perShare, setPerShare] = useState(DEFAULTS.perShare);
  const [perClick, setPerClick] = useState(DEFAULTS.perClick);
  const spendRef = useRef<HTMLInputElement | null>(null);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSpend(DEFAULTS.spend);
      setPerShare(DEFAULTS.perShare);
      setPerClick(DEFAULTS.perClick);
    }
  }

  // Same seeds as the stat tiles. Clicks aren't in the data model, so derive them as a rate
  // applied to reach — an independent range could exceed reach and read as broken.
  const { shares, reach, clicks, clickRate } = useMemo(() => {
    const reachValue = mockCount(`reach-${campaign.id}`, 3000, 90000);
    const rate = mockCount(`clicks-${campaign.id}`, 20, 80) / 1000;
    return {
      shares: mockCount(campaign.id, 40, 900),
      reach: reachValue,
      clicks: Math.round(reachValue * rate),
      clickRate: rate,
    };
  }, [campaign.id]);

  const spendValue = num(spend);
  const estimatedValue = shares * num(perShare) + clicks * num(perClick);
  const netValue = estimatedValue - spendValue;
  const roiPct = spendValue > 0 ? (netValue / spendValue) * 100 : null;

  const status =
    roiPct === null
      ? "Enter a spend to see ROI"
      : netValue >= 0
        ? `Earns back ${(estimatedValue / spendValue).toFixed(1)}× the spend`
        : `Spend exceeds value by ${formatCurrency(Math.abs(netValue))}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        side="right"
        initialFocus={spendRef}
        aria-label="Calculate ROI"
        className="flex !w-[464px] !max-w-[calc(100vw-2rem)] flex-col gap-0 border-0 bg-(--surface-canvas) p-0 text-foreground shadow-(--lift-edge)"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            onOpenChange(false);
          }
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-px [background-image:var(--specular-v)]"
        />

        <div className="flex shrink-0 items-start justify-between gap-3 px-7 pb-4 pt-6">
          <div className="min-w-0">
            <div className="mb-2 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="shrink-0 font-(family-name:--font-label) uppercase tracking-[0.09em] text-muted-foreground/60">
                Campaign
              </span>
              <span className="truncate font-medium text-foreground/85">
                {campaign.name}
              </span>
            </div>
            <h2 className="text-[21px] font-semibold leading-tight tracking-[-0.022em] text-balance">
              Calculate ROI
            </h2>
            <p className="mt-1.5 text-[12.5px] leading-snug text-muted-foreground text-pretty">
              An estimate from this campaign&rsquo;s reach and shares. Nothing here is
              saved.
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="-mr-2 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-(--r-pill) text-muted-foreground outline-none transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground focus-visible:inset-ring-2 focus-visible:inset-ring-violet-400/60 active:scale-(--press)"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto [background-image:var(--wash-page)] px-6 pb-6 pt-1 outline-none">
          <div className="overflow-hidden rounded-(--r-surface) bg-(--surface-raised) shadow-(--lift-lg) inset-ring-1 inset-ring-(--ink)/[0.08]">
            <div
              aria-hidden
              className="h-px w-full shrink-0 [background-image:var(--specular)]"
            />
            <div className="flex flex-col gap-4 px-5 py-5">
              <Field
                id="roi-spend"
                label="Campaign spend"
                hint="What this campaign cost to run."
                value={spend}
                onValue={setSpend}
                inputRef={spendRef}
              />
              <Field
                id="roi-per-share"
                label="Value per share"
                hint={`${shares} shares recorded.`}
                value={perShare}
                onValue={setPerShare}
              />
              <Field
                id="roi-per-click"
                label="Value per click"
                hint={`${formatFollowers(clicks)} clicks, assuming a ${(
                  clickRate * 100
                ).toFixed(1)}% clickthrough on reach.`}
                value={perClick}
                onValue={setPerClick}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Row label="Earned reach" value={formatFollowers(reach)} />
            <Row label="Estimated value" value={formatCurrency(estimatedValue)} />
            <Row label="Campaign spend" value={`−${formatCurrency(spendValue)}`} />
            <Row
              label="Net"
              value={formatCurrency(netValue)}
              tone={netValue >= 0 ? "good" : "bad"}
            />
            <div className="mt-1 flex items-center justify-between gap-3 rounded-(--r-inner) bg-(--ink)/[0.03] px-4 py-4 inset-ring-1 inset-ring-(--ink)/[0.06]">
              <span className="text-[12.5px] font-medium text-foreground/85">
                Return on investment
              </span>
              <span
                className={cn(
                  "text-[26px] font-semibold leading-none tracking-[-0.02em]",
                  roiPct === null
                    ? "text-muted-foreground/50"
                    : roiPct >= 0
                      ? "text-emerald-300"
                      : "text-rose-300",
                )}
              >
                {roiPct === null
                  ? "-"
                  : `${roiPct >= 0 ? "+" : ""}${roiPct.toFixed(0)}%`}
              </span>
            </div>
            {roiPct === null && (
              <p className="text-[12px] text-muted-foreground/70">
                Enter a campaign spend to see ROI.
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-(--ink)/[0.07] bg-(--sink)/[0.22] px-7 py-4">
          <span
            aria-live="polite"
            className="min-w-0 truncate text-[12px] text-muted-foreground/80"
          >
            {status}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => {
                setSpend(DEFAULTS.spend);
                setPerShare(DEFAULTS.perShare);
                setPerClick(DEFAULTS.perClick);
              }}
              className="flex h-9 items-center gap-1.5 rounded-(--r-pill) px-3.5 text-[13px] font-medium text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground active:scale-(--press)"
            >
              Reset
            </button>
            <button
              onClick={() => onOpenChange(false)}
              title="Done (⌘↵)"
              className="flex h-9 items-center gap-1.5 rounded-(--r-pill) bg-violet-600 px-4 text-[13px] font-medium text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15 transition-[background-color,box-shadow,scale] duration-200 hover:bg-violet-500 active:scale-(--press)"
            >
              <Calculator className="size-3.5" />
              Done
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  id,
  label,
  hint,
  value,
  onValue,
  inputRef,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  onValue: (next: string) => void;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-[13.5px] font-medium text-foreground/80">
        {label}
      </label>
      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-[14px] text-muted-foreground/60"
        >
          $
        </span>
        <input
          ref={inputRef}
          id={id}
          aria-describedby={`${id}-hint`}
          value={value}
          onChange={(e) => {
            const next = e.target.value.replace(/,/g, "");
            if (MONEY.test(next)) onValue(next);
          }}
          type="text"
          inputMode="decimal"
          placeholder="0"
          className={cn(inputClass(false), "pl-9")}
        />
      </div>
      <span id={`${id}-hint`} className="text-[12px] text-muted-foreground/70">
        {hint}
      </span>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-(--r-inner) bg-(--ink)/[0.03] px-4 py-3 inset-ring-1 inset-ring-(--ink)/[0.06]">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-[15px] font-semibold leading-none tracking-[-0.01em]",
          tone === "good" && "text-emerald-300",
          tone === "bad" && "text-rose-300",
        )}
      >
        {value}
      </span>
    </div>
  );
}
