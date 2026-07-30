"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeUrl, sanitizeRichText } from "@/lib/rich-text";

const MARKS: { command: string; label: string; keys: string; icon: typeof Bold }[] = [
  { command: "bold", label: "Bold", keys: "⌘B", icon: Bold },
  { command: "italic", label: "Italic", keys: "⌘I", icon: Italic },
];

const LISTS: { command: string; label: string; icon: typeof List }[] = [
  { command: "insertOrderedList", label: "Numbered list", icon: ListOrdered },
  { command: "insertUnorderedList", label: "Bulleted list", icon: List },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 148,
  ariaLabel,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  ariaLabel?: string;
}) {
  const area = useRef<HTMLDivElement>(null);
  const emitted = useRef(value);
  const savedRange = useRef<Range | null>(null);
  const [active, setActive] = useState<Record<string, boolean>>({});
  const [empty, setEmpty] = useState(true);
  const [focused, setFocused] = useState(false);
  const [linking, setLinking] = useState(false);
  const [linkDraft, setLinkDraft] = useState("");

  useEffect(() => {
    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch {}
  }, []);

  useEffect(() => {
    const el = area.current;
    if (!el) return;
    if (value !== emitted.current) {
      el.innerHTML = value;
      emitted.current = value;
    }
    setEmpty((el.textContent ?? "").trim().length === 0);
  }, [value]);

  const withinEditor = useCallback((selector: string) => {
    const el = area.current;
    const node = window.getSelection()?.anchorNode ?? null;
    if (!el || !node) return false;
    const start = node.nodeType === 1 ? (node as Element) : node.parentElement;
    const found = start?.closest(selector) ?? null;
    return Boolean(found && el.contains(found));
  }, []);

  const readState = useCallback(() => {
    const next: Record<string, boolean> = {};
    for (const { command } of [...MARKS, ...LISTS]) {
      try {
        next[command] = document.queryCommandState(command);
      } catch {
        next[command] = false;
      }
    }
    next.blockquote = withinEditor("blockquote");
    next.link = withinEditor("a");
    setActive(next);
  }, [withinEditor]);

  const emit = useCallback(() => {
    const el = area.current;
    if (!el) return;
    const html = sanitizeRichText(el.innerHTML);
    emitted.current = html;
    setEmpty((el.textContent ?? "").trim().length === 0);
    onChange(html);
  }, [onChange]);

  const reconcile = useCallback(() => {
    const el = area.current;
    if (!el) return;
    const html = sanitizeRichText(el.innerHTML);
    if (html !== el.innerHTML) el.innerHTML = html;
    emitted.current = html;
    onChange(html);
  }, [onChange]);

  function run(command: string, argument?: string) {
    const el = area.current;
    if (!el) return;
    el.focus();
    if (savedRange.current) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(savedRange.current);
      savedRange.current = null;
    }
    document.execCommand(command, false, argument);
    readState();
    emit();
  }

  function openLink() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedRange.current = selection.getRangeAt(0).cloneRange();
    }
    const node = selection?.anchorNode ?? null;
    const start = node?.nodeType === 1 ? (node as Element) : node?.parentElement;
    setLinkDraft(start?.closest("a")?.getAttribute("href") ?? "");
    setLinking(true);
  }

  function applyLink() {
    const href = normalizeUrl(linkDraft);
    setLinking(false);
    if (!href) return;
    run("createLink", href);
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-(--r-inner) bg-(--ink)/[0.03] transition-[box-shadow,background-color] duration-200 inset-ring-1",
        focused
          ? "bg-(--ink)/[0.05] inset-ring-violet-400/50"
          : "inset-ring-(--ink)/[0.09]",
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-(--ink)/[0.06] bg-(--ink)/[0.02] px-1.5 py-1.5">
        {MARKS.map(({ command, label, keys, icon: Icon }) => (
          <ToolButton
            key={command}
            label={label}
            hint={keys}
            on={active[command]}
            onPress={() => run(command)}
          >
            <Icon className="size-3.5" />
          </ToolButton>
        ))}

        <Divider />

        <ToolButton
          label={active.link ? "Edit link" : "Add link"}
          hint="⌘K"
          on={active.link || linking}
          onPress={openLink}
        >
          <Link2 className="size-3.5" />
        </ToolButton>
        {active.link && (
          <ToolButton label="Remove link" onPress={() => run("unlink")}>
            <Link2Off className="size-3.5" />
          </ToolButton>
        )}

        <Divider />

        <ToolButton
          label="Quote"
          on={active.blockquote}
          onPress={() => run("formatBlock", active.blockquote ? "p" : "blockquote")}
        >
          <Quote className="size-3.5" />
        </ToolButton>
        {LISTS.map(({ command, label, icon: Icon }) => (
          <ToolButton
            key={command}
            label={label}
            on={active[command]}
            onPress={() => run(command)}
          >
            <Icon className="size-3.5" />
          </ToolButton>
        ))}
      </div>

      {linking && (
        <div className="flex items-center gap-1.5 border-b border-(--ink)/[0.06] bg-violet-500/[0.05] px-2 py-1.5">
          <Link2 className="size-3.5 shrink-0 text-violet-300" />
          <input
            autoFocus
            value={linkDraft}
            onChange={(e) => setLinkDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                setLinking(false);
              }
            }}
            placeholder="wozku.com/campaigns"
            aria-label="Link address"
            className="h-7 min-w-0 flex-1 rounded-(--r-pill) bg-(--ink)/[0.05] px-2.5 text-[12px] caret-violet-400 inset-ring-1 inset-ring-(--ink)/[0.09] outline-none placeholder:text-muted-foreground/60 focus:inset-ring-violet-400/50"
          />
          <button
            type="button"
            onClick={applyLink}
            className="flex h-7 shrink-0 items-center rounded-(--r-pill) bg-violet-500/20 px-2.5 text-[11.5px] font-medium text-violet-100 transition-[background-color,scale] duration-150 hover:bg-violet-500/30 active:scale-(--press)"
          >
            {active.link ? "Update" : "Add"}
          </button>
          <button
            type="button"
            onClick={() => setLinking(false)}
            className="flex h-7 shrink-0 items-center rounded-(--r-pill) px-2 text-[11.5px] font-medium text-muted-foreground transition-[background-color,color] duration-150 hover:bg-(--ink)/[0.07] hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="relative">
        <div
          ref={area}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline
          aria-label={ariaLabel}
          onInput={emit}
          onBlur={() => {
            setFocused(false);
            reconcile();
          }}
          onFocus={() => {
            setFocused(true);
            readState();
          }}
          onKeyUp={readState}
          onMouseUp={readState}
          onKeyDown={(e) => {
            const mod = e.metaKey || e.ctrlKey;
            if (!mod) return;
            const key = e.key.toLowerCase();
            if (key === "b") {
              e.preventDefault();
              run("bold");
            } else if (key === "i") {
              e.preventDefault();
              run("italic");
            } else if (key === "k") {
              e.preventDefault();
              openLink();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, text);
            emit();
          }}
          style={{ minHeight }}
          className="rich-text block w-full px-3.5 py-3 text-[13.5px] leading-[1.6] caret-violet-400 outline-none"
        />
        {empty && placeholder && (
          <span
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-3 text-[13.5px] leading-[1.6] text-muted-foreground/50"
          >
            {placeholder}
          </span>
        )}
      </div>
    </div>
  );
}

function ToolButton({
  label,
  hint,
  on,
  onPress,
  children,
}: {
  label: string;
  hint?: string;
  on?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={on}
      title={hint ? `${label} (${hint})` : label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPress}
      className={cn(
        "flex size-7 items-center justify-center rounded-md transition-[background-color,color,scale] duration-150 active:scale-90",
        on
          ? "bg-violet-500/20 text-violet-100"
          : "text-muted-foreground hover:bg-(--ink)/[0.07] hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-(--ink)/[0.09]" />;
}
