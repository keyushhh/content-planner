export type SessionStatus = "draft" | "wip" | "approved";

export type Platform = "linkedin" | "instagram" | "facebook" | "x";

/** "PDF" is a document post: one PDF file the platform renders as swipeable
    pages. It takes exactly one asset, and that asset must be a PDF. */
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

/**
 * Feedback replaced comments outright, threads included. A comment thread asks
 * to be read; a piece of feedback asks to be acted on, and once every item
 * carries a status a reply is the wrong instrument:
 */
export type FeedbackStatus = "open" | "in_progress" | "done" | "wont_do";

export interface Feedback {
  id: string;
  author: User;
  /** Which section of the post it is attached to, if any. */
  sectionLabel?: string;
  text: string;
  createdAt: string;
  status: FeedbackStatus;
  /** Who moved it out of Open, and when. */
  resolvedBy?: User | null;
  resolvedAt?: string | null;
}

/** A person the admin can grant access to: seats that already exist on the
    Wozku account, so inviting is picking a name rather than typing an address. */
export interface SubAccount extends User {
  /** What they do on the account, shown under the name in the picker. */
  jobTitle: string;
  /** Already has access to the thing being shared. */
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
  /** Every campaign this post has been sent to. One post can live in several
      campaigns at once, so this is a list rather than a single id. */
  sentToCampaignIds: string[];
  sentAt: string | null;
  tags: string[];
  feedback: Feedback[];
  history: HistoryEntry[];
}

/**
 * A user-added column on the content table. Owned above the table so it
 * survives filtering, sorting, paging and reloads: a column you can only fill
 * in at the moment you create it is not a column.
 */
export interface CustomColumn {
  id: string;
  name: string;
}

/** sessionId → columnId → cell value. */
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
