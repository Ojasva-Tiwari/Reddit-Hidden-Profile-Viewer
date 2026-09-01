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
  RedditUser,
} from "./types";

/**
 * Normalizes content deletion/removal/edited status from Arctic Shift metadata.
 */
export function normalizeContentStatus(raw: {
  selftext?: string;
  body?: string;
  edited?: boolean | number;
  _meta?: {
    is_edited?: boolean;
    is_deleted?: boolean;
    is_removed?: boolean;
  };
}): ContentStatus {
  const text = (raw.selftext || raw.body || "").trim();

  if (text === "[deleted]" || raw._meta?.is_deleted) {
    return "DELETED";
  }

  if (text === "[removed]" || text.includes("[Removed by Moderator]") || raw._meta?.is_removed) {
    return "REMOVED";
  }

  if (
    raw.edited === true ||
    (typeof raw.edited === "number" && raw.edited > 0) ||
    raw._meta?.is_edited
  ) {
    return "EDITED";
  }

  return "VISIBLE";
}

/**
 * Normalizes media status and extracts media references from Arctic Shift submission payload.
 */
export function normalizeMediaReferences(raw: ArcticShiftPostRaw): {
  mediaStatus: MediaStatus;
  mediaReferences: RedditMediaReference[];
} {
  const refs: RedditMediaReference[] = [];

  // 1. Direct Image or Video URL
  const url = raw.url || "";
  const isDirectMedia =
    url.match(/\.(jpg|jpeg|png|gif|webp|mp4|mov)$/i) ||
    url.includes("i.redd.it") ||
    url.includes("v.redd.it") ||
    url.includes("imgur.com");

  let mainThumbnail = raw.thumbnail && raw.thumbnail.startsWith("http") ? raw.thumbnail : null;

  // 2. Extract preview images if available
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

  // 3. Extract gallery metadata if available
  if (raw.media_metadata) {
    for (const [key, item] of Object.entries(raw.media_metadata)) {
      if (item && item.s?.u) {
        const fullUrl = item.s.u.replace(/&amp;/g, "&");
        const thumbUrl = item.p?.[0]?.u?.replace(/&amp;/g, "&");
        refs.push({
          mediaUrl: fullUrl,
          thumbnailUrl: thumbUrl,
          mediaType: item.e === "RedditVideo" ? "VIDEO" : "IMAGE",
          status: item.status === "valid" ? "MEDIA_AVAILABLE" : "MEDIA_UNAVAILABLE",
        });
      }
    }
  }

  // 4. Fallback URL reference
  if (refs.length === 0 && isDirectMedia) {
    refs.push({
      mediaUrl: url,
      thumbnailUrl: mainThumbnail,
      mediaType: url.includes("v.redd.it") ? "VIDEO" : "IMAGE",
      status: "MEDIA_REFERENCE_ONLY",
    });
  }

  let mediaStatus: MediaStatus = "MEDIA_REFERENCE_ONLY";
  if (refs.some((r) => r.status === "MEDIA_AVAILABLE")) {
    mediaStatus = "MEDIA_AVAILABLE";
  } else if (mainThumbnail) {
    mediaStatus = "THUMBNAIL_AVAILABLE";
  } else if (isDirectMedia) {
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
    permalink: raw.permalink.startsWith("/") ? raw.permalink : `/${raw.permalink}`,
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
