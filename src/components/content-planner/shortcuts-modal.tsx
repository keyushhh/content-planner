"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const GROUPS: { title: string; note?: string; rows: [string[], string][] }[] = [
  {
    title: "Repository",
    note: "While the table has focus and no post is open.",
    rows: [
      [["J"], "Move down a row"],
      [["K"], "Move up a row"],
      [["X"], "Tick the row you are on"],
      [["Shift", "X"], "Tick everything up to it"],
      [["Enter"], "Open the row"],
      [["Esc"], "Drop the row cursor"],
    ],
  },
  {
    title: "Composer",
    rows: [
      [["⌘", "S"], "Save now"],
      [["⌘", "↵"], "Send to a campaign, once approved"],
      [["Esc"], "Save and step back"],
    ],
  },
  {
    title: "Anywhere",
    rows: [
      [["⌘", "K"], "Search posts, campaigns and actions"],
      [["Ctrl", "Shift", "D"], "Developer panel"],
    ],
  },
];

export function ShortcutsModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-label="Keyboard shortcuts"
        className="flex max-h-[min(80vh,720px)] w-[480px] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-(--r-surface) border-0 bg-(--surface-dialog) p-0 text-left text-foreground shadow-(--lift-lg) inset-ring-1 inset-ring-(--ink)/[0.09] sm:max-w-[480px]"
      >
        <div
          aria-hidden
          className="h-px w-full shrink-0 [background-image:var(--specular)]"
        />

        <DialogHeader className="shrink-0 gap-0 px-6 pb-4 pt-6 text-left">
          <DialogTitle className="font-heading text-[20px] font-semibold leading-tight tracking-[-0.022em]">
            Keyboard shortcuts
          </DialogTitle>
          <DialogDescription className="mt-1 text-[12.5px] text-muted-foreground">
            Everything here works today. Row keys need the table focused, not a text field.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          {GROUPS.map((group) => (
            <section key={group.title} className="mt-4 first:mt-0">
              <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-muted-foreground/70">
                {group.title}
              </h3>
              {group.note && (
                <p className="mt-1 text-[11.5px] text-muted-foreground/70">
                  {group.note}
                </p>
              )}
              <dl className="mt-2 flex flex-col">
                {group.rows.map(([keys, label]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 border-b border-(--ink)/[0.05] py-2 last:border-b-0"
                  >
                    <dt className="min-w-0 text-[12.5px] text-foreground/85">{label}</dt>
                    <dd className="flex shrink-0 items-center gap-1">
                      {keys.map((key) => (
                        <kbd
                          key={key}
                          className="flex h-[22px] min-w-[22px] items-center justify-center rounded-(--r-inner) bg-(--ink)/[0.06] px-1.5 text-[11px] font-medium text-muted-foreground inset-ring-1 inset-ring-(--ink)/[0.09]"
                        >
                          {key}
                        </kbd>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
