import { MEDIA_COPY } from "./media";
import type { Session } from "./types";

export type ReadinessField = "copy" | "assets" | "tags";

export interface ReadinessItem {
  field: ReadinessField;
  /** Reads as the object of "Add …", e.g. "an asset". */
  label: string;
  done: boolean;
  required: boolean;
}

/** Pass copyDraft from the composer, where copy is local until autosave. */
export function postReadiness(session: Session, copyDraft?: string): ReadinessItem[] {
  const copy = copyDraft ?? session.copy;
  const media = MEDIA_COPY[session.postType];
  return [
    { field: "copy", label: "copy", done: copy.trim().length > 0, required: true },
    // Reshare keeps the original post's media, so there is nothing to attach.
    ...(session.postType === "Reshare"
      ? []
      : [
          {
            field: "assets" as const,
            label: media.checklist,
            done: session.visualAssetIds.length > 0,
            required: true,
          },
        ]),
    { field: "tags", label: "tags", done: session.tags.length > 0, required: false },
  ];
}

export function canApprove(items: ReadinessItem[]) {
  return items.every((item) => item.done || !item.required);
}

export function missingRequired(items: ReadinessItem[]) {
  return items.filter((item) => item.required && !item.done);
}

export function blockedReason(items: ReadinessItem[]) {
  const missing = missingRequired(items);
  if (missing.length === 0) return "";
  const labels = missing.map((item) => item.label);
  const list =
    labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
  return `Add ${list} first`;
}
