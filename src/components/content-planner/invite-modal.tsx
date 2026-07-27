"use client";

import { useState } from "react";
import { Mail, UserPlus, Shield, Check, Info, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Role = "editor" | "commenter";

const ROLES: { id: Role; label: string; hint: string; icon: typeof Shield }[] = [
  { id: "editor", label: "Editor", hint: "Can write and change posts", icon: Shield },
  { id: "commenter", label: "Commenter", hint: "Can comment, not edit", icon: MessageCircle },
];

const EASE = "cubic-bezier(0.2,0,0,1)";

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
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("editor");
  const [sent, setSent] = useState(false);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setEmail("");
      onOpenChange(false);
    }, 1400);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Built as a small Canvas sheet: specular top edge, hairline-divided
          sections, and a footer that holds the action rather than a full-width slab. */}
      <DialogContent
        showCloseButton={false}
        className="w-[520px] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-[24px] border-0 bg-[oklch(0.26_0_0)] p-0 text-foreground shadow-[0_2px_4px_rgba(0,0,0,0.35),0_32px_72px_-32px_rgba(0,0,0,1)] inset-ring-1 inset-ring-white/[0.09] sm:max-w-[520px]"
      >
        <div
          aria-hidden
          className="h-px w-full shrink-0 bg-gradient-to-r from-transparent via-white/[0.11] to-transparent"
        />

        <DialogHeader className="p-0 text-left">
          <div className="flex items-start gap-3.5 px-6 pb-5 pt-6">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-500/12 text-violet-300 inset-ring-1 inset-ring-violet-400/25">
              <UserPlus className="size-[18px]" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <DialogTitle className="text-[17px] font-semibold tracking-[-0.01em]">
                Invite to {contextName}
              </DialogTitle>
              <DialogDescription className="mt-1 text-[13px] leading-snug text-muted-foreground text-pretty">
                They&rsquo;ll get an email, and must accept before they can see any content.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSend}>
          <div className="space-y-4 border-t border-white/[0.06] px-6 py-5">
            <div>
              <label
                htmlFor="invite-email"
                className="mb-1.5 block w-fit cursor-pointer text-[13px] font-medium text-muted-foreground"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="invite-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="h-10 w-full rounded-[10px] bg-white/[0.04] pl-9 pr-3 text-sm caret-violet-400 inset-ring-1 inset-ring-white/[0.08] outline-none transition-[box-shadow,background-color] duration-200 placeholder:text-muted-foreground/75 focus:bg-white/[0.06] focus:inset-ring-violet-400/50"
                />
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-[13px] font-medium text-muted-foreground">
                Role
              </span>
              {/* Each option states what it grants — that is the actual decision */}
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
                        "flex flex-col gap-1 rounded-[12px] px-3 py-2.5 text-left inset-ring-1 transition-[background-color,box-shadow,scale] duration-150 active:scale-[0.98]",
                        active
                          ? "bg-violet-500/[0.12] inset-ring-violet-400/45"
                          : "bg-white/[0.03] inset-ring-white/[0.07] hover:bg-white/[0.055]",
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
                No team members to pick from yet — add subadmins in your Wozku account
                settings.
              </span>
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] bg-black/[0.12] px-6 py-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-9 items-center rounded-full px-3.5 text-[13px] font-medium text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-white/[0.06] hover:text-foreground active:scale-[0.97]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sent || !email.trim()}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium text-white inset-ring-1 inset-ring-white/15 transition-[background-color,box-shadow,scale] duration-200 active:scale-[0.97] disabled:pointer-events-none",
                sent
                  ? "bg-emerald-600 shadow-[0_1px_2px_rgba(0,0,0,0.3),0_6px_16px_-8px_rgba(16,185,129,0.7)]"
                  : "bg-violet-600 shadow-[0_1px_2px_rgba(0,0,0,0.3),0_6px_16px_-8px_rgba(139,92,246,0.7)] hover:bg-violet-500 disabled:opacity-40 disabled:shadow-none",
              )}
            >
              {/* icons cross-fade so the confirmation animates in rather than swapping */}
              <span className="relative flex size-3.5 items-center justify-center">
                <Check
                  className={cn(
                    "absolute size-3.5 transition-[opacity,scale,filter] duration-200",
                    sent ? "scale-100 opacity-100 blur-0" : "scale-[0.25] opacity-0 blur-[4px]",
                  )}
                  style={{ transitionTimingFunction: EASE }}
                />
                <Mail
                  className={cn(
                    "absolute size-3.5 transition-[opacity,scale,filter] duration-200",
                    sent ? "scale-[0.25] opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-0",
                  )}
                  style={{ transitionTimingFunction: EASE }}
                />
              </span>
              {sent ? "Invitation sent" : "Send invitation"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
