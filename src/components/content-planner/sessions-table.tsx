"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { ConfirmDialog } from "./confirm-dialog";
import { cn, isSessionLocked, sessionNeedsResend } from "@/lib/utils";
import { Send, Lock, LockOpen, Info, Trash2, RefreshCw } from "lucide-react";
import type { Session } from "@/lib/types";

interface SessionsTableProps {
  sessions: Session[];
  selectedSessionId: string | null;
  onSelectSession: (id: string) => void;
  onOpenSend: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onUnlockSession: (id: string) => void;
  emptyState?: { title: string; description: string };
}

const GRID = "grid-cols-[1fr_160px_110px_130px_40px] gap-3";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function SessionsTable({
  sessions,
  selectedSessionId,
  onSelectSession,
  onOpenSend,
  onDeleteSession,
  onUnlockSession,
  emptyState = {
    title: "No sessions yet",
    description: 'Click "New Session" to create your first post.',
  },
}: SessionsTableProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmUnlockId, setConfirmUnlockId] = useState<string | null>(null);
  const sessionPendingDelete = sessions.find((s) => s.id === confirmDeleteId) ?? null;
  const sessionPendingUnlock = sessions.find((s) => s.id === confirmUnlockId) ?? null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div
        className={cn(
          "grid items-center border-b border-border px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground/80",
          GRID,
        )}
      >
        <span>Session Name</span>
        <span>Last Edited By</span>
        <span>Status</span>
        <span>Sent to Campaign</span>
        <span />
      </div>

      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-muted-foreground">
            <span className="text-sm font-medium">{emptyState.title}</span>
            <span className="text-xs">{emptyState.description}</span>
          </div>
        ) : (
          sessions.map((session) => {
            const isSelected = session.id === selectedSessionId;
            const locked = isSessionLocked(session);
            const needsResend = sessionNeedsResend(session);
            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={cn(
                  "group grid items-center border-b border-border/60 px-4 py-3 cursor-pointer transition-colors",
                  GRID,
                  isSelected ? "bg-primary/[0.06]" : "hover:bg-accent/30",
                )}
              >
                <span className="truncate pr-4 font-medium text-sm">
                  {session.title}
                </span>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {session.lastEditedBy ? (
                    <>
                      <Avatar className="size-6">
                        <AvatarFallback className="text-[10px]">
                          {initials(session.lastEditedBy.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">
                        {session.lastEditedBy.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground/50">
                      Not edited yet
                    </span>
                  )}
                </div>

                <div>
                  <StatusBadge status={session.status} />
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                  {locked ? (
                    <button
                      onClick={() => setConfirmUnlockId(session.id)}
                      title="Sent and unchanged since. Click to unlock and edit."
                      className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
                    >
                      <Lock className="size-3" />
                      Locked
                    </button>
                  ) : needsResend ? (
                    session.status === "approved" ? (
                      <Button
                        size="sm"
                        className="h-7 gap-1.5 bg-violet-600 text-xs text-white hover:bg-violet-500"
                        onClick={() => onOpenSend(session.id)}
                      >
                        <RefreshCw className="size-3" />
                        Update
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled
                        title="Approve this post to send the update"
                        className="h-7 gap-1.5 text-xs text-muted-foreground/60"
                      >
                        <Info className="size-3" />
                        Update
                      </Button>
                    )
                  ) : session.status === "approved" ? (
                    <Button
                      size="sm"
                      className="h-7 gap-1.5 bg-violet-600 text-xs text-white hover:bg-violet-500"
                      onClick={() => onOpenSend(session.id)}
                    >
                      <Send className="size-3" />
                      Send
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled
                      className="h-7 gap-1.5 text-xs text-muted-foreground/60"
                    >
                      <Info className="size-3" />
                      Send
                    </Button>
                  )}
                </div>

                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex justify-end"
                >
                  <button
                    onClick={() => setConfirmDeleteId(session.id)}
                    aria-label="Delete session"
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={sessionPendingDelete !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        icon={Trash2}
        tone="destructive"
        title={
          sessionPendingDelete ? (
            <>Delete &ldquo;{sessionPendingDelete.title}&rdquo;?</>
          ) : (
            ""
          )
        }
        description="This can't be undone. The session and all its content will be permanently removed."
        actions={[
          {
            label: "Cancel",
            tone: "outline",
            onClick: () => setConfirmDeleteId(null),
          },
          {
            label: "Delete",
            icon: Trash2,
            tone: "destructive",
            onClick: () => {
              if (sessionPendingDelete) onDeleteSession(sessionPendingDelete.id);
              setConfirmDeleteId(null);
            },
          },
        ]}
      />

      <ConfirmDialog
        open={sessionPendingUnlock !== null}
        onOpenChange={(open) => !open && setConfirmUnlockId(null)}
        icon={LockOpen}
        tone="violet"
        title="Unlock this post?"
        description="This moves it back to WIP so you can edit it. It stays sent to Wozku as-is until you re-approve and send the update — nothing changes there until then."
        actions={[
          {
            label: "Cancel",
            tone: "outline",
            onClick: () => setConfirmUnlockId(null),
          },
          {
            label: "Unlock",
            icon: LockOpen,
            tone: "primary",
            onClick: () => {
              if (sessionPendingUnlock) onUnlockSession(sessionPendingUnlock.id);
              setConfirmUnlockId(null);
            },
          },
        ]}
      />
    </div>
  );
}
