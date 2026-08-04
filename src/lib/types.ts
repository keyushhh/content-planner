import type { ContestSettings } from "./contest";
import type { ScreenTheme } from "./screen-theme";

export type SessionStatus = "draft" | "wip" | "approved";

export type Platform = "linkedin" | "x" | "slack" | "facebook" | "instagram";

export type PostType = "Image" | "Frames" | "Reshare" | "PDF";

export interface User {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

export interface CampaignSettings {
  multiPostIntervals: boolean;
  holdAndFire: boolean;
  sendToAdvocates: boolean;
  communityInvitation: boolean;
  jobRoles: string[];
}

export interface Campaign {
  id: string;
  name: string;
  tag: string;
  inWozku: boolean;
  /** Published but temporarily off — the public screen is unavailable until resumed. */
  paused: boolean;
  /** Ended by hand before its end date. Kept separate from `endDate` so stopping a
   *  campaign doesn't rewrite the schedule it was planned against. */
  stopped: boolean;
  /** Submitted posts kept out of the public screen. Per-campaign, so the same post can
   *  show in one campaign and be hidden in another. */
  hiddenSessionIds: string[];
  endDate: string;
  platforms: Platform[];
  sessionIds: string[];
  logoUrl: string;
  headerUrl: string;
  headerPosition?: number;
  description: string;
  thankYou: string;
  redirectUrl: string;
  linkedInCompanyId?: string;
  settings: CampaignSettings;
  theme: ScreenTheme;
  contest: ContestSettings;
}

export type CampaignState = "draft" | "live" | "paused" | "ended";

/** The editor's shape. Runtime state — publication, pausing, screen visibility — is not
 *  something the form owns, so those keys stay out. */
export type NewCampaign = Omit<
  Campaign,
  "id" | "inWozku" | "sessionIds" | "paused" | "stopped" | "hiddenSessionIds" | "theme" | "contest"
>;

export interface PostVariation {
  id: string;
  label: string;
  copy: string;
  assetIds: string[];
  mentionedAccountIds: string[];
}

export type FeedbackStatus = "open" | "in_progress" | "done" | "discarded";

export interface Feedback {
  id: string;
  author: User;
  sectionLabel?: string;
  text: string;
  createdAt: string;
  status: FeedbackStatus;
  resolvedBy?: User | null;
  resolvedAt?: string | null;
}

export interface SubAccount extends User {
  jobTitle: string;
  alreadyHasAccess?: boolean;
}

export interface HistoryEntry {
  id: string;
  actor: User;
  action: string;
  createdAt: string;
}

export interface Session {
  id: string;
  /** Set while the guided tutorial owns this post. */
  tutorial?: boolean;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastEditedBy: User | null;
  status: SessionStatus;
  postType: PostType;
  platforms: Platform[];
  visualAssetIds: string[];
  copy: string;
  variations: PostVariation[];
  mentionedAccountIds: string[];
  hashtags: string;
  draftCampaignIds: string[];
  sentToCampaignIds: string[];
  sentAt: string | null;
  tags: string[];
  feedback: Feedback[];
  history: HistoryEntry[];
}

export interface CustomColumn {
  id: string;
  name: string;
}

export type CustomCellValues = Record<string, Record<string, string>>;

export interface MediaFolder {
  id: string;
  name: string;
}

export type MediaAssetType = "image" | "embed" | "pdf";

export interface MediaAsset {
  id: string;
  folderId: string;
  name: string;
  url: string;
  type: MediaAssetType;
}
