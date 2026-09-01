export type ContentStatus =
  | "VISIBLE"
  | "DELETED"
  | "REMOVED"
  | "EDITED"
  | "DELETED_LATER"
  | "INITIALLY_UNAVAILABLE";

export type MediaStatus =
  | "MEDIA_AVAILABLE"
  | "ARCHIVED_COPY"
  | "THUMBNAIL_AVAILABLE"
  | "MEDIA_REFERENCE_ONLY"
  | "MEDIA_UNAVAILABLE";

export type AIClassification =
  | "EXPLICIT"
  | "STRONGLY_SUPPORTED"
  | "WEAK_INFERENCE";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "SPECULATIVE";

export type SyncStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED";

export interface UserProfileMetrics {
  totalPosts: number;
  totalComments: number;
  deletedPosts: number;
  deletedComments: number;
  removedPosts: number;
  removedComments: number;
  editedPosts: number;
  editedComments: number;
}

export interface UserProfile {
  id: string;
  redditId?: string;
  username: string;
  avatarUrl?: string | null;
  createdUtc: string;
  accountAgeYears?: number;
  firstSeenUtc?: string;
  lastSeenUtc?: string;
  totalKarma: number;
  linkKarma: number;
  commentKarma: number;
  isSuspended?: boolean;
  isDeleted?: boolean;
  syncStatus: SyncStatus;
  syncProgress?: number;
  syncProgressPercent?: number;
  lastSyncedAt?: string;
  metrics?: UserProfileMetrics;
}

export interface PostItem {
  id: string;
  redditId: string;
  title: string;
  selftext: string;
  subreddit: string;
  subredditName?: string;
  author: string;
  authorUsername?: string;
  score: number;
  upvoteRatio?: number;
  numComments: number;
  createdUtc: string;
  editedUtc?: string | null;
  status: ContentStatus;
  mediaStatus: MediaStatus;
  permalink: string;
  url?: string;
  mediaUrl?: string;
  isNsfw?: boolean;
  isSpoiler?: boolean;
  isLocked?: boolean;
}

export interface CommentItem {
  id: string;
  redditId: string;
  postId?: string;
  postRedditId: string;
  parentId?: string;
  parentRedditId?: string;
  subreddit: string;
  subredditName?: string;
  author: string;
  authorUsername?: string;
  score: number;
  createdUtc: string;
  editedUtc?: string | null;
  status: ContentStatus;
  body: string;
  permalink?: string;
  isDistinguished?: string;
  parentContext?: {
    author: string;
    bodySnippet: string;
  };
}

export interface ActivityDistribution {
  topSubreddits: { name: string; count: number; score: number; percentage: number }[];
  yearlyActivity: { year: number; posts: number; comments: number }[];
  hourlyActivityUtc: { hour: number; count: number }[];
  dailyActivity: { day: string; count: number }[];
}

export interface TimelineEvent {
  id: string;
  year: number;
  dateStr: string;
  type: "POST" | "COMMENT" | "MILESTONE";
  title: string;
  subreddit: string;
  status: ContentStatus;
  snippet: string;
  score: number;
  redditId: string;
}

export interface AIInsight {
  index: number;
  category: string;
  title: string;
  finding: string;
  confidence: ConfidenceLevel;
  classification: AIClassification;
  reasoning: string;
  evidenceIds: string[];
  supportingCitations: {
    redditId: string;
    subreddit: string;
    sourceType: "POST" | "COMMENT";
    quote: string;
    score: number;
    createdUtc: string;
    status: ContentStatus;
  }[];
}
