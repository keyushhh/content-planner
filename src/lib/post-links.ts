import { platformMeta } from "./platforms";
import type { Platform, Session } from "./types";

export interface PostLink {
  id: string;
  label: string;
  /** Says what the link does, and why someone would hand out this one. */
  blurb: string;
  path: string;
}

/** The page an advocate lands on. This is the one a QR belongs on. */
export function publicPostPath(sessionId: string): string {
  return `/p/${sessionId}`;
}

/** Still lands on our page first, so the variation is assigned and the share is counted,
 *  then opens the platform composer. A direct link to the platform would skip both. */
export function platformSharePath(sessionId: string, platform: Platform): string {
  return `/p/${sessionId}?share=${platform}`;
}

export function postLinks(session: Session): PostLink[] {
  return [
    {
      id: "public",
      label: "Public link",
      blurb:
        "Where the QR code and any link you hand out should point. Advocates land here, get a version of the post, and share it from there.",
      path: publicPostPath(session.id),
    },
    ...session.platforms.map((platform) => {
      const meta = platformMeta(platform);
      return {
        id: `share-${platform}`,
        label: meta.label,
        blurb: `Opens ${meta.label} with the post ready to go. It still passes through the landing page, so the share is counted and a version is assigned.`,
        path: platformSharePath(session.id, platform),
      };
    }),
  ];
}

export function absoluteUrl(origin: string, path: string): string {
  return `${origin}${path}`;
}

/** Filesystem-safe stem for a downloaded QR code. */
export function qrFileName(postTitle: string, linkLabel: string): string {
  const slug = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled";

  return `${slug(postTitle)}-${slug(linkLabel)}-qr`;
}
