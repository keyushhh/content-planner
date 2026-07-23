"use client";

import { useState } from "react";
import { Mail, UserPlus, Shield, Check, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface InviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contextName?: string;
}

export function InviteModal({ open, onOpenChange, contextName = "this campaign" }: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "commenter">("editor");
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
      <DialogContent className="w-[520px] max-w-[calc(100vw-2rem)] sm:max-w-[520px] gap-0 rounded-2xl border border-border/80 bg-background p-5 shadow-2xl">
        <DialogHeader className="p-0 text-left">
          <div className="flex items-start gap-3.5 pr-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-600/15 text-violet-400 border border-violet-500/20">
              <UserPlus className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                Invite to {contextName}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-muted-foreground whitespace-nowrap">
                An email will be sent. They must accept before accessing content.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-3.5 mb-3 rounded-xl border border-border/60 bg-muted/30 p-2.5 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <Info className="size-4 shrink-0 text-violet-400 mt-0.5" />
            <span className="leading-snug">
              No team members available to invite directly. Add subadmins in your Wozku account settings.
            </span>
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="h-9.5 pl-9.5 text-sm bg-background border-border focus:border-violet-500/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
              Role & Permissions
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("editor")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border py-2 px-3 text-xs font-medium transition-colors",
                  role === "editor"
                    ? "border-violet-500/80 bg-violet-500/10 text-violet-300 font-semibold"
                    : "border-border/80 bg-transparent text-muted-foreground hover:bg-accent/40"
                )}
              >
                <Shield className="size-3.5" />
                Editor
              </button>
              <button
                type="button"
                onClick={() => setRole("commenter")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border py-2 px-3 text-xs font-medium transition-colors",
                  role === "commenter"
                    ? "border-violet-500/80 bg-violet-500/10 text-violet-300 font-semibold"
                    : "border-border/80 bg-transparent text-muted-foreground hover:bg-accent/40"
                )}
              >
                Commenter
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={sent}
            className="mt-1 h-9.5 w-full gap-2 rounded-xl bg-violet-600 text-sm font-medium text-white hover:bg-violet-500 shadow-sm"
          >
            {sent ? (
              <>
                <Check className="size-4" />
                Invitation Sent!
              </>
            ) : (
              <>Send Invitation</>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
