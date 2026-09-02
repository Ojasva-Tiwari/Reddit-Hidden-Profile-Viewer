import {
  ContentStatus,
  MediaStatus,
} from "@/types";

// ============================================================================
// CANONICAL INTERNAL DATA MODELS
// ============================================================================

export interface RedditUser {
  redditId?: string; // e.g. "t2_1w72"
  username: string;
  avatarUrl?: string | null;
  createdUtc?: Date | null;
  firstSeenUtc?: Date | null;
  lastSeenUtc?: Date | null;
  totalKarma?: number | null;
  linkKarma?: number | null;
  commentKarma?: number | null;
  isSuspended: boolean;
  isDeleted: boolean;
  rawPayload?: Record<string, any>;
}

export interface RedditPost {
  redditId: string; // e.g. "t3_1vgbkge"
  authorUsername: string;
  authorRedditId?: string;
  subredditName: string;
  subredditRedditId?: string;
  title: string;
  selftext: string;
  url?: string | null;
  permalink: string;
  score: number;
  upvoteRatio?: number | null;
  numComments: number;
  createdUtc: Date;
  editedUtc?: Date | null;
  status: ContentStatus;
  mediaStatus: MediaStatus;
  isNsfw: boolean;
  isSpoiler: boolean;
  isLocked: boolean;
  rawPayload?: Record<string, any>;
  mediaReferences?: RedditMediaReference[];
}

export interface RedditComment {
  redditId: string; // e.g. "t1_p1wosm9"
  postId?: string;
  postRedditId: string; // e.g. "t3_1vgbkge"
  parentId: string; // e.g. "t1_xxx" or "t3_xxx"
  authorUsername: string;
  authorRedditId?: string;
  subredditName: string;
  subredditRedditId?: string;
  body: string;
  permalink?: string | null;
  score: number;
  createdUtc: Date;
  editedUtc?: Date | null;
  status: ContentStatus;
  isDistinguished?: string | null;
  isNsfw: boolean;
  rawPayload?: Record<string, any>;
}

export interface RedditSubreddit {
  redditId?: string; // e.g. "t5_3k30p"
  name: string;
  displayName: string;
  subscribersCount?: number | null;
  isNsfw?: boolean;
}

export interface RedditProvenance {
  targetType: "POST" | "COMMENT";
  targetRedditId: string;
  versionNumber: number;
  statusAtSnapshot: ContentStatus;
  previousContent?: string | null;
  currentContent?: string | null;
  diffPatch?: string | null;
  recordedAt: Date;
  sourceOrigin: string;
}

export interface RedditMediaReference {
  mediaUrl: string;
  thumbnailUrl?: string | null;
  archiveUrl?: string | null;
  mediaType?: string | null;
  status: MediaStatus;
}

// ============================================================================
// QUERY PARAMETERS & PAGINATION
// ============================================================================

export interface SearchQueryOptions {
  author?: string;
  subreddit?: string;
  limit?: number; // default 100, max 100
  before?: number; // Unix epoch seconds
  after?: number; // Unix epoch seconds
  sort?: "asc" | "desc";
  sortType?: "created_utc" | "score" | "num_comments";
}

export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  nextBefore?: number;
  nextAfter?: number;
  nextCursor?: string | number;
  totalFetched: number;
}

// ============================================================================
// UPSTREAM ARCTIC SHIFT RAW RESPONSES
// ============================================================================

export interface ArcticShiftPostRaw {
  id: string;
  name?: string;
  author: string;
  author_fullname?: string;
  subreddit: string;
  subreddit_id?: string;
  title: string;
  selftext?: string;
  url?: string;
  permalink: string;
  score?: number;
  ups?: number;
  upvote_ratio?: number;
  num_comments?: number;
  created_utc: number;
  edited?: boolean | number;
  over_18?: boolean;
  spoiler?: boolean;
  locked?: boolean;
  distinguished?: string | null;
  thumbnail?: string;
  preview?: {
    images?: Array<{
      source?: { url?: string };
      resolutions?: Array<{ url?: string; width?: number; height?: number }>;
    }>;
  };
  media_metadata?: Record<string, any>;
  _meta?: {
    retrieved_on?: number;
    retrieved_2nd_on?: number;
    is_edited?: boolean;
    is_deleted?: boolean;
    is_removed?: boolean;
  };
  [key: string]: any;
}

export interface ArcticShiftCommentRaw {
  id: string;
  name?: string;
  author: string;
  author_fullname?: string;
  subreddit: string;
  subreddit_id?: string;
  body: string;
  link_id: string;
  parent_id: string;
  permalink?: string;
  score?: number;
  ups?: number;
  created_utc: number;
  edited?: boolean | number;
  distinguished?: string | null;
  profile_img?: string;
  _meta?: {
    retrieved_on?: number;
    retrieved_2nd_on?: number;
    is_edited?: boolean;
    is_deleted?: boolean;
    is_removed?: boolean;
  };
  [key: string]: any;
}

export interface ArcticShiftApiResponse<T> {
  data: T[];
  error?: string;
}
