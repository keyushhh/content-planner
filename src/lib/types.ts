export type SessionStatus = "draft" | "wip" | "approved";

export type Platform = "linkedin" | "instagram" | "facebook" | "x";

export type PostType = "Image" | "Frames" | "Reshare" | "PDF";

export interface User {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

export interface Campaign {
  id: string;
  name: string;
  tag: string;
  inWozku: boolean;
  endDate: string;
  sessionIds: string[];
}

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
