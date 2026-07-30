"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Info,
  MessageCircle,
  Search,
  Shield,
  UserPlus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/components/ui/toast";
import { avatarTint, cn } from "@/lib/utils";
import { subAccounts } from "@/lib/mock-data";
import type { SubAccount } from "@/lib/types";

type Role = "editor" | "commenter";

const ROLES: { id: Role; label: string; hint: string; icon: typeof Shield }[] = [
  { id: "editor", label: "Editor", hint: "Can write and change posts", icon: Shield },
  { id: "commenter", label: "Commenter", hint: "Can comment, not edit", icon: MessageCircle },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface InviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contextName?: string;
}

export function InviteModal({
  open,
  onOpenChange,
  contextName = "this campaign",
}: InviteModalProps) {
  const toast = useToast();
  const [personId, setPersonId] = useState<string | null>(null);
  const [role, setRole] = useState<Role>("editor");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setPersonId(null);
      setRole("editor");
      setQuery("");
    }
  }

  const person = subAccounts.find((s) => s.id === personId) ?? null;

  const q = query.trim().toLowerCase();
  const results = useMemo(
    () =>
      q
        ? subAccounts.filter(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              s.jobTitle.toLowerCase().includes(q),
          )
        : subAccounts,
    [q],
  );

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!person || person.alreadyHasAccess) return;
    onOpenChange(false);
    toast({
      title: "Invitation sent",
      description: `${person.name} can now ${
        role === "commenter" ? "comment on" : "edit"
      } ${contextName}.`,
      tone: "success",
    });
  }

  function choose(s: SubAccount) {
    setPersonId(s.id);
    setPickerOpen(false);
    setQuery("");
  }

  const canSend = person !== null && !person.alreadyHasAccess;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[520px] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-(--r-surface) border-0 bg-(--surface-dialog) p-0 text-foreground shadow-(--lift-lg) inset-ring-1 inset-ring-(--ink)/[0.09] sm:max-w-[520px]"
      >
        <div
          aria-hidden
          className="h-px w-full shrink-0 [background-image:var(--specular)]"
        />

        <DialogHeader className="p-0 text-left">
          <div className="flex items-start gap-3.5 px-6 pb-5 pt-6">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-(--r-pill) bg-violet-500/12 text-violet-300 inset-ring-1 inset-ring-violet-400/25">
              <UserPlus className="size-[18px]" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <DialogTitle className="text-[17px] font-semibold tracking-[-0.01em] text-balance">
                Invite to {contextName}
              </DialogTitle>
              <DialogDescription className="mt-1 text-[13px] leading-snug text-muted-foreground text-pretty">
                They&rsquo;ll be notified, and must accept before they can see any
                content.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSend}>
          <div className="space-y-4 border-t border-(--ink)/[0.06] px-6 py-5">
            <div>
              <span className="mb-1.5 block text-[13px] font-medium text-muted-foreground">
                Person
              </span>
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      aria-label="Choose a person from your account"
                      className={cn(
                        "flex h-11 w-full items-center gap-2.5 rounded-(--r-inner) bg-(--ink)/[0.04] px-2.5 text-left inset-ring-1 transition-[background-color,box-shadow] duration-200 hover:bg-(--ink)/[0.06]",
                        pickerOpen
                          ? "inset-ring-violet-400/50"
                          : "inset-ring-(--ink)/[0.08]",
                      )}
                    />
                  }
                >
                  {person ? (
                    <>
                      <Avatar className="size-7 shrink-0 inset-ring-1 inset-ring-(--ink)/10">
                        <AvatarFallback
                          className={cn("text-[10px] font-medium", avatarTint(person.name))}
                        >
                          {initials(person.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">
                          {person.name}
                        </span>
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {person.jobTitle}
                        </span>
                      </span>
                    </>
                  ) : (
                    <span className="min-w-0 flex-1 pl-0.5 text-[13px] text-muted-foreground">
                      Select from your account…
                    </span>
                  )}
                  <ChevronDown className="mr-1 size-4 shrink-0 text-muted-foreground/70" />
                </PopoverTrigger>

                <PopoverContent
                  align="start"
                  className="w-[var(--anchor-width)] overflow-hidden rounded-(--r-float) border-0 bg-(--surface-float) p-0 shadow-(--lift-lg) inset-ring-1 inset-ring-(--ink)/[0.09]"
                >
                  {subAccounts.length > 5 && (
                    <div className="border-b border-(--ink)/[0.06] p-2">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <input
                          autoFocus
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search people…"
                          aria-label="Search people"
                          className="h-8 w-full rounded-lg bg-(--ink)/[0.05] pl-7.5 pr-2.5 text-[13px] caret-violet-400 inset-ring-1 inset-ring-(--ink)/[0.08] outline-none placeholder:text-muted-foreground/75 focus:inset-ring-violet-400/50"
                        />
                      </div>
                    </div>
                  )}

                  <div className="max-h-[248px] overflow-y-auto p-1.5">
                    {results.map((s) => {
                      const isSelected = s.id === personId;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          disabled={s.alreadyHasAccess}
                          onClick={() => choose(s)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-(--r-inner) px-2 py-1.5 text-left transition-colors duration-100",
                            s.alreadyHasAccess
                              ? "cursor-default opacity-55"
                              : "hover:bg-(--ink)/[0.06]",
                            isSelected && "bg-violet-500/[0.12]",
                          )}
                        >
                          <Avatar className="size-7 shrink-0 inset-ring-1 inset-ring-(--ink)/10">
                            <AvatarFallback
                              className={cn(
                                "text-[10px] font-medium",
                                avatarTint(s.name),
                              )}
                            >
                              {initials(s.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium">
                              {s.name}
                            </span>
                            <span className="block truncate text-[11px] text-muted-foreground">
                              {s.jobTitle}
                            </span>
                          </span>
                          {s.alreadyHasAccess ? (
                            <span className="shrink-0 text-[11px] font-medium text-emerald-300/85">
                              Has access
                            </span>
                          ) : (
                            isSelected && (
                              <Check className="size-3.5 shrink-0 text-violet-300" />
                            )
                          )}
                        </button>
                      );
                    })}

                    {results.length === 0 && (
                      <p className="px-2 py-6 text-center text-[12px] text-muted-foreground text-pretty">
                        Nobody on the account matches &ldquo;{query.trim()}&rdquo;.
                      </p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <span className="mb-1.5 block text-[13px] font-medium text-muted-foreground">
                Role
              </span>
              <div role="radiogroup" aria-label="Role" className="grid grid-cols-2 gap-2">
                {ROLES.map(({ id, label, hint, icon: Icon }) => {
                  const active = role === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setRole(id)}
                      className={cn(
                        "flex flex-col gap-1 rounded-(--r-inner) px-3 py-2.5 text-left inset-ring-1 transition-[background-color,box-shadow,scale] duration-150 active:scale-(--press-lg)",
                        active
                          ? "bg-violet-500/[0.12] inset-ring-violet-400/45"
                          : "bg-(--ink)/[0.03] inset-ring-(--ink)/[0.07] hover:bg-(--ink)/[0.055]",
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <Icon
                          className={cn(
                            "size-3.5 shrink-0 transition-colors duration-150",
                            active ? "text-violet-300" : "text-muted-foreground",
                          )}
                        />
                        <span
                          className={cn(
                            "text-[13px] font-medium",
                            active ? "text-violet-100" : "text-foreground/90",
                          )}
                        >
                          {label}
                        </span>
                      </span>
                      <span className="text-[11px] leading-snug text-muted-foreground">
                        {hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="flex items-start gap-2 text-[11px] leading-snug text-muted-foreground">
              <Info className="mt-px size-3.5 shrink-0 text-muted-foreground/70" />
              <span className="text-pretty">
                Only people already on your Wozku account appear here. Add a
                sub-account in account settings to invite somebody new.
              </span>
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-(--ink)/[0.06] bg-(--sink)/[0.12] px-6 py-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-9 items-center rounded-(--r-pill) px-3.5 text-[13px] font-medium text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground active:scale-(--press)"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSend}
              className="flex h-9 items-center gap-1.5 rounded-(--r-pill) bg-violet-600 px-4 text-[13px] font-medium text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15 transition-[background-color,box-shadow,scale] duration-200 hover:bg-violet-500 active:scale-(--press) disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none"
            >
              <UserPlus className="size-3.5" />
              Send invitation
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
