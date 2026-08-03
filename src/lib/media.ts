import type { MediaAsset, PostType } from "./types";

export const MEDIA_COPY: Record<
  PostType,
  {
    section: string;
    checklist: string;
    attached: string;
    cta: string;
    ctaTitle: string;
    ctaHint: string;
    max: number;
  }
> = {
  Image: {
    section: "Assets",
    checklist: "an asset",
    attached: "Asset attached",
    cta: "Add an image",
    ctaTitle: "Add assets",
    ctaHint: "One image",
    max: Infinity,
  },
  Frames: {
    section: "Frames",
    checklist: "a frame",
    attached: "Frame attached",
    cta: "Add the first frame",
    ctaTitle: "Add frames",
    ctaHint: "Several images, swiped in order",
    max: Infinity,
  },
  PDF: {
    section: "PDF",
    checklist: "a PDF",
    attached: "PDF attached",
    cta: "Add a PDF",
    ctaTitle: "Add a PDF",
    ctaHint: "One document, swiped as pages",
    max: 1,
  },
  Reshare: {
    section: "Media",
    checklist: "",
    attached: "",
    cta: "",
    ctaTitle: "",
    ctaHint: "",
    max: 0,
  },
};

export function assetsForType(
  ids: string[],
  assets: MediaAsset[],
  type: PostType,
): string[] {
  if (type === "Reshare") return ids;
  const kept = ids.filter((id) => {
    const asset = assets.find((a) => a.id === id);
    if (!asset) return type !== "PDF";
    return type === "PDF" ? asset.type === "pdf" : asset.type !== "pdf";
  });
  const { max } = MEDIA_COPY[type];
  return Number.isFinite(max) ? kept.slice(0, max) : kept;
}
