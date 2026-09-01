import {
  ContentStatus,
  MediaStatus,
} from "@/types";
import {
  ArcticShiftPostRaw,
  ArcticShiftCommentRaw,
  RedditPost,
  RedditComment,
  RedditProvenance,
  RedditMediaReference,
} from "./types";

/**
 * Normalizes content deletion/removal/edited status from Arctic Shift metadata.
 * Accurately detects VISIBLE, DELETED, REMOVED, EDITED, DELETED_LATER, and INITIALLY_UNAVAILABLE.
 */
export function normalizeContentStatus(raw: {
  title?: string;
  selftext?: string;
  body?: string;
  edited?: boolean | number;
  _meta?: {
    is_edited?: boolean;
    is_deleted?: boolean;
    is_removed?: boolean;
    retrieved_on?: number;
    retrieved_2nd_on?: number;
  };
}): ContentStatus {
  const text = (raw.selftext ?? raw.body ?? "").trim();
  const hasText = text.length > 0;
  const isExplicitDeleted = text === "[deleted]";
  const isExplicitRemoved = text === "[removed]" || text.includes("[Removed by Moderator]");

  // 1. Initially Unavailable if no text and no title exists
  if (!hasText && !raw.title && raw.selftext === undefined && raw.body === undefined) {
    return "INITIALLY_UNAVAILABLE";
  }

  // 2. Deleted Later: Body was captured in archival snapshot, but 2nd-pass/metadata flags show deleted later
  if (raw._meta?.is_deleted && hasText && !isExplicitDeleted && !isExplicitRemoved) {
    return "DELETED_LATER";
  }

  // 3. Removed by Moderator
  if (isExplicitRemoved || raw._meta?.is_removed) {
    return "REMOVED";
  }

  // 4. Deleted by User
  if (isExplicitDeleted || (raw._meta?.is_deleted && !hasText)) {
    return "DELETED";
  }

  // 5. Edited
  if (
    raw.edited === true ||
    (typeof raw.edited === "number" && raw.edited > 0) ||
    raw._meta?.is_edited
  ) {
    return "EDITED";
  }

  // 6. Visible by default
  return "VISIBLE";
}

/**
 * Normalizes media status and extracts media references from Arctic Shift submission payload.
 * Strictly adheres to: MEDIA_AVAILABLE, ARCHIVED_COPY, THUMBNAIL_AVAILABLE, MEDIA_REFERENCE_ONLY, MEDIA_UNAVAILABLE.
 */
export function normalizeMediaReferences(raw: ArcticShiftPostRaw): {
  mediaStatus: MediaStatus;
  mediaReferences: RedditMediaReference[];
} {
  const refs: RedditMediaReference[] = [];

  const url = (raw.url || "").trim();
  const isRedditMediaHost = url.includes("i.redd.it") || url.includes("v.redd.it");
  const isDirectMediaExt = /\.(jpg|jpeg|png|gif|webp|mp4|mov)$/i.test(url);
  const isExternalMediaDomain = url.includes("imgur.com") || url.includes("gfycat.com") || url.includes("streamable.com");

  let mainThumbnail: string | null = null;
  if (raw.thumbnail && raw.thumbnail.startsWith("http") && !raw.thumbnail.includes("default") && !raw.thumbnail.includes("self")) {
    mainThumbnail = raw.thumbnail.replace(/&amp;/g, "&");
  }

  // 1. Preview images metadata from Reddit
  if (raw.preview?.images && raw.preview.images.length > 0) {
    const img = raw.preview.images[0];
    const sourceUrl = img.source?.url?.replace(/&amp;/g, "&");
    const thumbUrl = img.resolutions?.[0]?.url?.replace(/&amp;/g, "&") || mainThumbnail;

    if (sourceUrl) {
      refs.push({
        mediaUrl: sourceUrl,
        thumbnailUrl: thumbUrl,
        mediaType: "IMAGE",
        status: "MEDIA_AVAILABLE",
      });
    }
  }

  // 2. Gallery metadata
  if (raw.media_metadata) {
    for (const [key, item] of Object.entries(raw.media_metadata)) {
      if (item && item.s?.u) {
        const fullUrl = item.s.u.replace(/&amp;/g, "&");
        const thumbUrl = item.p?.[0]?.u?.replace(/&amp;/g, "&") || mainThumbnail;
        refs.push({
          mediaUrl: fullUrl,
          thumbnailUrl: thumbUrl,
          mediaType: item.e === "RedditVideo" ? "VIDEO" : "IMAGE",
          status: item.status === "valid" ? "MEDIA_AVAILABLE" : "MEDIA_UNAVAILABLE",
        });
      }
    }
  }

  // 3. External media reference without preview bytes
  if (refs.length === 0 && (isRedditMediaHost || isDirectMediaExt || isExternalMediaDomain)) {
    refs.push({
      mediaUrl: url,
      thumbnailUrl: mainThumbnail,
      mediaType: url.includes("v.redd.it") || url.endsWith(".mp4") ? "VIDEO" : "IMAGE",
      status: mainThumbnail ? "THUMBNAIL_AVAILABLE" : "MEDIA_REFERENCE_ONLY",
    });
  }

  // Determine overall mediaStatus
  let mediaStatus: MediaStatus = "MEDIA_UNAVAILABLE";
  if (refs.some((r) => r.status === "MEDIA_AVAILABLE")) {
    mediaStatus = "MEDIA_AVAILABLE";
  } else if (mainThumbnail || refs.some((r) => r.status === "THUMBNAIL_AVAILABLE")) {
    mediaStatus = "THUMBNAIL_AVAILABLE";
  } else if (refs.some((r) => r.status === "MEDIA_REFERENCE_ONLY") || isRedditMediaHost || isDirectMediaExt) {
    mediaStatus = "MEDIA_REFERENCE_ONLY";
  }

  return { mediaStatus, mediaReferences: refs };
}

/**
 * Normalizes an Arctic Shift submission into canonical RedditPost.
 */
export function normalizePost(raw: ArcticShiftPostRaw): RedditPost {
  const redditId = raw.name || (raw.id.startsWith("t3_") ? raw.id : `t3_${raw.id}`);
  const status = normalizeContentStatus(raw);
  const { mediaStatus, mediaReferences } = normalizeMediaReferences(raw);

  let editedUtc: Date | null = null;
  if (typeof raw.edited === "number" && raw.edited > 0) {
    editedUtc = new Date(raw.edited * 1000);
  }

  let upvoteRatio: number | null = null;
  if (typeof raw.upvote_ratio === "number") {
    upvoteRatio = parseFloat(raw.upvote_ratio.toFixed(3));
  }

  return {
    redditId,
    authorUsername: raw.author,
    authorRedditId: raw.author_fullname,
    subredditName: raw.subreddit,
    subredditRedditId: raw.subreddit_id,
    title: raw.title || "",
    selftext: raw.selftext || "",
    url: raw.url || null,
    permalink: raw.permalink ? (raw.permalink.startsWith("/") ? raw.permalink : `/${raw.permalink}`) : `/r/${raw.subreddit}/comments/${raw.id}`,
    score: raw.score ?? raw.ups ?? 0,
    upvoteRatio,
    numComments: raw.num_comments ?? 0,
    createdUtc: new Date(raw.created_utc * 1000),
    editedUtc,
    status,
    mediaStatus,
    isNsfw: Boolean(raw.over_18),
    isSpoiler: Boolean(raw.spoiler),
    isLocked: Boolean(raw.locked),
    rawPayload: raw,
    mediaReferences,
  };
}

/**
 * Normalizes an Arctic Shift comment into canonical RedditComment.
 */
export function normalizeComment(raw: ArcticShiftCommentRaw): RedditComment {
  const redditId = raw.name || (raw.id.startsWith("t1_") ? raw.id : `t1_${raw.id}`);
  const status = normalizeContentStatus(raw);

  let editedUtc: Date | null = null;
  if (typeof raw.edited === "number" && raw.edited > 0) {
    editedUtc = new Date(raw.edited * 1000);
  }

  const postRedditId = raw.link_id.startsWith("t3_") ? raw.link_id : `t3_${raw.link_id}`;

  return {
    redditId,
    postRedditId,
    parentId: raw.parent_id,
    authorUsername: raw.author,
    authorRedditId: raw.author_fullname,
    subredditName: raw.subreddit,
    subredditRedditId: raw.subreddit_id,
    body: raw.body || "",
    permalink: raw.permalink ? (raw.permalink.startsWith("/") ? raw.permalink : `/${raw.permalink}`) : null,
    score: raw.score ?? raw.ups ?? 0,
    createdUtc: new Date(raw.created_utc * 1000),
    editedUtc,
    status,
    isDistinguished: raw.distinguished || null,
    rawPayload: raw,
  };
}

/**
 * Derives RedditProvenance records if revision metadata is present.
 */
export function extractProvenance(postOrComment: RedditPost | RedditComment): RedditProvenance | null {
  if (postOrComment.status === "EDITED" && postOrComment.editedUtc) {
    const isPost = "title" in postOrComment;
    return {
      targetType: isPost ? "POST" : "COMMENT",
      targetRedditId: postOrComment.redditId,
      versionNumber: 2,
      statusAtSnapshot: "EDITED",
      currentContent: isPost ? (postOrComment as RedditPost).selftext : (postOrComment as RedditComment).body,
      recordedAt: postOrComment.editedUtc,
      sourceOrigin: "ARCTIC_SHIFT",
    };
  }
  return null;
}
