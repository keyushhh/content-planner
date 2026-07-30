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
  endDate: string;
  platforms: Platform[];
  sessionIds: string[];
  logoUrl: string;
  headerUrl: string;
  description: string;
  thankYou: string;
  redirectUrl: string;
  settings: CampaignSettings;
}

export type CampaignState = "draft" | "live" | "ended";

export type NewCampaign = Omit<Campaign, "id" | "inWozku" | "sessionIds">;

export interface PostVariation {
  id: string;
  label: string;
  copy: string;
  assetIds: string[];
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
