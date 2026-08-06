"use client";

import { ChevronDown, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SetupSectionId =
  | "distribution"
  | "posts"
  | "moments"
  | "contest"
  | "embed";

type SetupSectionProps = {
  icon: LucideIcon;
  title: string;
  summary: React.ReactNode;
} & (
  | {
      variant?: "accordion";
      open: boolean;
      onToggle: () => void;
      children: React.ReactNode;
    }
  | { variant: "dialog"; onOpen: () => void }
);

export function SetupSection(props: SetupSectionProps) {
  const { icon: Icon, title, summary } = props;
  const dialog = props.variant === "dialog";
  const open = dialog ? false : props.open;

  return (
    <div
      className={cn(
        "rounded-(--r-surface) bg-(--surface-raised) shadow-(--lift-sm) transition-[box-shadow] duration-150 inset-ring-1",
        open ? "inset-ring-(--ink)/[0.12]" : "inset-ring-(--ink)/[0.08]",
      )}
    >
      <button
        type="button"
        onClick={dialog ? props.onOpen : props.onToggle}
        aria-expanded={dialog ? undefined : open}
        aria-haspopup={dialog ? "dialog" : undefined}
        className="flex w-full items-center gap-2.5 rounded-(--r-surface) px-4 py-3.5 text-left transition-colors duration-150 hover:bg-(--ink)/[0.03]"
      >
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-(--r-inner) transition-colors duration-150",
            open ? "bg-violet-500/15 text-violet-200" : "bg-(--ink)/[0.05] text-muted-foreground",
          )}
        >
          <Icon className="size-3.5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold">{title}</span>
          {!open && (
            <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
              {summary}
            </span>
          )}
        </span>

        {dialog ? (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        )}
      </button>

      {!dialog && open && (
        <div className="flex flex-col gap-3 border-t border-(--ink)/[0.06] px-4 pt-3.5 pb-4 duration-200 animate-in fade-in">
          {props.children}
        </div>
      )}
    </div>
  );
}
