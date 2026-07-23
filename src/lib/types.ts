export type SessionStatus = "draft" | "wip" | "approved";

export type Platform = "linkedin" | "instagram" | "facebook" | "x";

export type PostType = "Image" | "Frames" | "Reshare";

export interface User {
  id: string;
  name: string;
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

export interface Comment {
  id: string;
  author: User;
  fieldLabel?: string;
  text: string;
  createdAt: string;
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
  sentToCampaignId: string | null;
  sentAt: string | null;
  tags: string[];
  comments: Comment[];
  history: HistoryEntry[];
}

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
