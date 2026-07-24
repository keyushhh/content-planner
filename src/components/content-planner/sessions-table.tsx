"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { ConfirmDialog } from "./confirm-dialog";
import { cn, isSessionLocked, sessionNeedsResend } from "@/lib/utils";
import {
  Send,
  Lock,
  LockOpen,
  Info,
  Trash2,
  RefreshCw,
  Copy,
  AlertTriangle,
  Plus,
  X,
} from "lucide-react";
import type { Session } from "@/lib/types";

interface CustomColumn {
  id: string;
  name: string;
}

interface SessionsTableProps {
  sessions: Session[];
  selectedSessionId: string | null;
  onSelectSession: (id: string) => void;
  onOpenSend: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onUnlockSession: (id: string) => void;
  onDuplicateSession?: (id: string) => void;
  emptyState?: { title: string; description: string };
}

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
  onDuplicateSession,
  emptyState = {
    title: "No sessions yet",
    description: 'Click "New Session" to create your first post.',
  },
}: SessionsTableProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmUnlockId, setConfirmUnlockId] = useState<string | null>(null);

  // Dynamic custom columns state
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [editingHeaderId, setEditingHeaderId] = useState<string | null>(null);
  const [customCellValues, setCustomCellValues] = useState<
    Record<string, Record<string, string>>
  >({});
  const [editingCell, setEditingCell] = useState<{
    sessionId: string;
    colId: string;
  } | null>(null);

  const sessionPendingDelete =
    sessions.find((s) => s.id === confirmDeleteId) ?? null;
  const sessionPendingUnlock =
    sessions.find((s) => s.id === confirmUnlockId) ?? null;

  const handleAddColumn = () => {
    const newId = `col-${Date.now()}`;
    const newName = `Column ${customColumns.length + 1}`;
    setCustomColumns((prev) => [...prev, { id: newId, name: newName }]);
    setEditingHeaderId(newId);
  };

  const handleRemoveColumn = (colId: string) => {
    setCustomColumns((prev) => prev.filter((c) => c.id !== colId));
  };

  const handleUpdateHeaderName = (colId: string, newName: string) => {
    setCustomColumns((prev) =>
      prev.map((c) => (c.id === colId ? { ...c, name: newName || "Column" } : c))
    );
  };

  const handleUpdateCellValue = (
    sessionId: string,
    colId: string,
    val: string
  ) => {
    setCustomCellValues((prev) => ({
      ...prev,
      [sessionId]: {
        ...(prev[sessionId] || {}),
        [colId]: val,
      },
    }));
  };

  // Dynamic CSS grid template columns
  const gridStyle = {
    gridTemplateColumns: `minmax(200px, 1.5fr) 160px 110px 130px ${customColumns
      .map(() => "140px")
      .join(" ")} 60px 40px`,
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="w-full overflow-x-auto border-b border-border">
        <div
          style={gridStyle}
          className="grid min-w-max items-center px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground/80 gap-3"
        >
          <span>Session Name</span>
          <span>Last Edited By</span>
          <span>Status</span>
          <span>Sent to Campaign</span>

          {/* Custom Column Headers */}
          {customColumns.map((col) => (
            <div key={col.id} className="min-w-0">
              {editingHeaderId === col.id ? (
                <input
                  autoFocus
                  value={col.name}
                  onChange={(e) => handleUpdateHeaderName(col.id, e.target.value)}
                  onBlur={() => setEditingHeaderId(null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "Escape") setEditingHeaderId(null);
                  }}
                  className="h-6 w-full rounded border border-violet-500/50 bg-background px-1.5 text-xs text-foreground uppercase tracking-wide font-medium outline-none"
                />
              ) : (
                <div className="group/col flex items-center justify-between gap-1 pr-1">
                  <span
                    onClick={() => setEditingHeaderId(col.id)}
                    title="Click to rename column"
                    className="truncate cursor-pointer hover:text-foreground font-medium transition-colors"
                  >
                    {col.name}
                  </span>
                  <button
                    onClick={() => handleRemoveColumn(col.id)}
                    title="Remove column"
                    className="opacity-0 group-hover/col:opacity-100 text-muted-foreground hover:text-rose-400 transition-opacity"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              )}
            </div>
          ))}

          <span />

          {/* Add Column Button (+ icon at the extreme right) */}
          <div className="flex items-center justify-center">
            <button
              onClick={handleAddColumn}
              title="Add column"
              className="flex size-6 items-center justify-center rounded bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300 transition-colors"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-auto">
        {sessions.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-muted-foreground min-w-max p-8">
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
                style={gridStyle}
                className={cn(
                  "group grid min-w-max items-center border-b border-border/60 px-4 py-3 cursor-pointer transition-colors gap-3",
                  isSelected ? "bg-primary/[0.06]" : "hover:bg-accent/30"
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

                {/* Custom Column Cell Values */}
                {customColumns.map((col) => {
                  const cellVal =
                    customCellValues[session.id]?.[col.id] || "Untitled";
                  const isEditing =
                    editingCell?.sessionId === session.id &&
                    editingCell?.colId === col.id;

                  return (
                    <div key={col.id} className="min-w-0" onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
                        <input
                          autoFocus
                          value={
                            customCellValues[session.id]?.[col.id] ??
                            (cellVal === "Untitled" ? "" : cellVal)
                          }
                          onChange={(e) =>
                            handleUpdateCellValue(
                              session.id,
                              col.id,
                              e.target.value
                            )
                          }
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === "Escape")
                              setEditingCell(null);
                          }}
                          className="h-7 w-full rounded border border-violet-500/50 bg-background px-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-violet-500"
                        />
                      ) : (
                        <span
                          onClick={() =>
                            setEditingCell({
                              sessionId: session.id,
                              colId: col.id,
                            })
                          }
                          title="Click to edit"
                          className={cn(
                            "inline-block max-w-full cursor-pointer truncate rounded px-1.5 py-0.5 text-xs transition-colors hover:bg-accent/60",
                            cellVal === "Untitled"
                              ? "text-muted-foreground/50 italic"
                              : "text-foreground font-medium"
                          )}
                        >
                          {cellVal}
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Actions column */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-end gap-1"
                >
                  {onDuplicateSession && (
                    <button
                      onClick={() => onDuplicateSession(session.id)}
                      aria-label="Duplicate session"
                      title="Duplicate content item"
                      className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmDeleteId(session.id)}
                    aria-label="Delete session"
                    title="Delete session"
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                {/* Empty column placeholder matching header + button */}
                <div />
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={sessionPendingDelete !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        icon={AlertTriangle}
        tone="destructive"
        title={
          sessionPendingDelete ? (
            <>Delete &ldquo;{sessionPendingDelete.title}&rdquo;?</>
          ) : (
            ""
          )
        }
        description="This action cannot be undone. All content associated with this session will be permanently removed."
        actions={[
          {
            label: "Delete session",
            tone: "destructive",
            onClick: () => {
              if (sessionPendingDelete) onDeleteSession(sessionPendingDelete.id);
              setConfirmDeleteId(null);
            },
          },
          {
            label: "Cancel",
            tone: "outline",
            onClick: () => setConfirmDeleteId(null),
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
