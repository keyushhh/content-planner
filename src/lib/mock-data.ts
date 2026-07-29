import type {
  Campaign,
  MediaAsset,
  MediaFolder,
  Session,
  SubAccount,
  User,
} from "./types";

export const currentUser: User = {
  id: "u-biradhwaj",
  name: "Biradhwaj Senapati",
  email: "biradhwajsenapati@gmail.com",
};

export const users: User[] = [
  currentUser,
  { id: "u-sarah", name: "Sarah Taylor" },
  { id: "u-john", name: "John M." },
];

/**
 * Seats that already exist under the admin's Wozku account. Inviting somebody
 * is picking one of these rather than typing an address: the account decides
 * who exists, so an email field could only be a way to get it wrong.
 */
export const subAccounts: SubAccount[] = [
  {
    id: "sa-sarah",
    name: "Sarah Taylor",
    email: "sarah.taylor@wozku.com",
    jobTitle: "Content lead",
  },
  {
    id: "sa-john",
    name: "John M.",
    email: "john.m@wozku.com",
    jobTitle: "Social manager",
    alreadyHasAccess: true,
  },
  {
    id: "sa-priya",
    name: "Priya R.",
    email: "priya.r@wozku.com",
    jobTitle: "Designer",
  },
  {
    id: "sa-sam",
    name: "Sam O.",
    email: "sam.o@wozku.com",
    jobTitle: "Copywriter",
  },
  {
    id: "sa-mei",
    name: "Mei Lin",
    email: "mei.lin@wozku.com",
    jobTitle: "Campaign analyst",
  },
  {
    id: "sa-diego",
    name: "Diego Alvarez",
    email: "diego.alvarez@wozku.com",
    jobTitle: "Brand manager",
  },
];

export const mediaFolders: MediaFolder[] = [
  { id: "folder-background", name: "Background Image" },
  { id: "folder-frames", name: "Frames" },
  { id: "folder-gift", name: "Gift Images" },
  { id: "folder-headers", name: "Headers" },
  { id: "folder-logos", name: "Logos" },
  { id: "folder-post", name: "Post images" },
  { id: "folder-thankyou", name: "Thankyou images" },
  { id: "folder-welcome", name: "Welcome Images" },
];

export const mediaAssets: MediaAsset[] = [
  {
    id: "asset-logo-black",
    folderId: "folder-logos",
    name: "logo-black.png",
    url: "",
    type: "image",
  },
  {
    id: "asset-post-1",
    folderId: "folder-post",
    name: "product-launch-hero.png",
    url: "",
    type: "image",
  },
  {
    id: "asset-frame-1",
    folderId: "folder-frames",
    name: "frame-gold.png",
    url: "",
    type: "image",
  },
  {
    id: "asset-post-embed-1",
    folderId: "folder-post",
    name: "product-demo-walkthrough.embed",
    url: "",
    type: "embed",
  },
  {
    id: "asset-post-pdf-1",
    folderId: "folder-post",
    name: "campaign-spec-sheet.pdf",
    url: "",
    type: "pdf",
  },
  // A PDF post type filters the library to PDFs only, so there needs to be more
  // than one of them for the picker to look like a library rather than an error.
  {
    id: "asset-post-pdf-2",
    folderId: "folder-post",
    name: "q3-results-carousel.pdf",
    url: "",
    type: "pdf",
  },
  {
    id: "asset-post-pdf-3",
    folderId: "folder-headers",
    name: "hiring-deck-5-slides.pdf",
    url: "",
    type: "pdf",
  },
];

export const campaigns: Campaign[] = [
  {
    id: "camp-test-contest",
    name: "test-contest",
    tag: "CONTEST",
    inWozku: true,
    endDate: "2026-08-04",
    sessionIds: ["session-1", "session-2", "session-3", "session-4"],
  },
  {
    id: "camp-summer-launch",
    name: "summer-launch",
    tag: "LAUNCH",
    inWozku: true,
    endDate: "2026-09-15",
    sessionIds: [],
  },
];

export const sessions: Session[] = [
  {
    id: "session-1",
    title: "Untitled Session",
    createdAt: "2026-07-23T10:00:00Z",
    updatedAt: "2026-07-23T10:20:00Z",
    lastEditedBy: null,
    status: "draft",
    postType: "Image",
    platforms: ["linkedin"],
    visualAssetIds: [],
    copy: "",
    variations: [],
    hashtags: "",
    sentToCampaignIds: [],
    sentAt: null,
    tags: ["social"],
    feedback: [],
    history: [],
  },
  {
    id: "session-2",
    title: "Untitled Session",
    createdAt: "2026-07-23T10:00:00Z",
    updatedAt: "2026-07-23T10:00:00Z",
    lastEditedBy: null,
    status: "draft",
    postType: "Image",
    platforms: ["linkedin"],
    visualAssetIds: [],
    copy: "",
    variations: [],
    hashtags: "",
    sentToCampaignIds: [],
    sentAt: null,
    tags: ["email"],
    feedback: [],
    history: [],
  },
  {
    id: "session-3",
    title: "Untitled Session",
    createdAt: "2026-07-23T10:00:00Z",
    updatedAt: "2026-07-23T10:00:00Z",
    lastEditedBy: null,
    status: "draft",
    postType: "Image",
    platforms: ["linkedin"],
    visualAssetIds: [],
    copy: "",
    variations: [],
    hashtags: "",
    sentToCampaignIds: [],
    sentAt: null,
    tags: [],
    feedback: [],
    history: [],
  },
  {
    id: "session-4",
    title: "test-contest",
    createdAt: "2026-07-21T12:08:00Z",
    updatedAt: "2026-07-21T12:08:00Z",
    lastEditedBy: users[2],
    status: "approved",
    postType: "Image",
    platforms: ["linkedin"],
    visualAssetIds: ["asset-post-1"],
    copy: "Announcing our biggest contest of the year! Enter now for a chance to win amazing prizes.",
    variations: [],
    hashtags: "#contest #giveaway",
    sentToCampaignIds: [],
    sentAt: null,
    tags: ["contest", "giveaway"],
    feedback: [
      {
        id: "fb-1",
        author: users[2],
        sectionLabel: "Copy",
        text: "Let's tighten this up before we send it out. The opening line buries the prize.",
        createdAt: "2026-07-21T12:30:00Z",
        status: "open",
      },
      {
        id: "fb-2",
        author: users[1],
        sectionLabel: "Assets",
        text: "Swap the hero image for the one with the product in frame.",
        createdAt: "2026-07-21T12:44:00Z",
        status: "done",
        resolvedBy: users[2],
        resolvedAt: "2026-07-21T13:10:00Z",
      },
    ],
    history: [
      {
        id: "h-1",
        actor: users[2],
        action: "Approved this session",
        createdAt: "2026-07-21T13:00:00Z",
      },
      {
        id: "h-2",
        actor: users[2],
        action: "Created this session",
        createdAt: "2026-07-21T12:08:00Z",
      },
    ],
  },
];
