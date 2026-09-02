import { IRedditDataSource } from "./reddit-data-source";
import {
  RedditUser,
  RedditPost,
  RedditComment,
  SearchQueryOptions,
  PaginatedResult,
  ArcticShiftPostRaw,
  ArcticShiftCommentRaw,
} from "./types";
import { normalizePost, normalizeComment } from "./normalization";

export interface ArcticShiftConfig {
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  baseBackoffMs?: number;
}

export class ArcticShiftDataSource implements IRedditDataSource {
  public readonly providerName = "ARCTIC_SHIFT";
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly baseBackoffMs: number;

  constructor(config: ArcticShiftConfig = {}) {
    this.baseUrl = (
      config.baseUrl ||
      process.env.ARCTIC_SHIFT_BASE_URL ||
      "https://arctic-shift.photon-reddit.com"
    ).replace(/\/$/, "");
    this.timeoutMs = config.timeoutMs ?? 10000;
    this.maxRetries = config.maxRetries ?? 3;
    this.baseBackoffMs = config.baseBackoffMs ?? 600;
  }

  /**
   * Internal resilient fetch wrapper with exponential backoff, Retry-After handling, and timeout.
   */
  private async fetchWithRetry<T>(endpoint: string, params: Record<string, string | number | undefined>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null) {
        url.searchParams.append(key, String(val));
      }
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "User-Agent": "RedditHiddenProfileViewer/1.0",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return (await response.json()) as T;
        }

        // Rate limiting (429) or Server error (5xx)
        if (response.status === 429 || (response.status >= 500 && response.status <= 599)) {
          const retryAfterHeader = response.headers.get("Retry-After");
          let delayMs = this.baseBackoffMs * Math.pow(2, attempt);

          if (retryAfterHeader) {
            const parsedSeconds = parseInt(retryAfterHeader, 10);
            if (!isNaN(parsedSeconds)) {
              delayMs = parsedSeconds * 1000;
            }
          }

          console.warn(
            `[ArcticShift] Upstream HTTP ${response.status} on ${endpoint} (attempt ${attempt + 1}/${this.maxRetries + 1}). Retrying in ${delayMs}ms...`
          );

          if (attempt < this.maxRetries) {
            await new Promise((res) => setTimeout(res, delayMs));
            continue;
          }
        }

        // Permanent client error (400, 404, etc.)
        throw new Error(`ArcticShift HTTP error ${response.status}: ${response.statusText}`);
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err;

        if (err.name === "AbortError") {
          console.warn(`[ArcticShift] Request timeout after ${this.timeoutMs}ms on ${endpoint} (attempt ${attempt + 1})`);
        } else {
          console.warn(`[ArcticShift] Request error on ${endpoint}: ${err.message}`);
        }

        if (attempt < this.maxRetries) {
          const delayMs = this.baseBackoffMs * Math.pow(2, attempt);
          await new Promise((res) => setTimeout(res, delayMs));
        }
      }
    }

    throw lastError || new Error(`Failed to fetch from ArcticShift: ${endpoint}`);
  }

  /**
   * Look up user profile from recent submission/comment activity.
   */
  async getUserProfile(username: string): Promise<RedditUser | null> {
    const cleanUsername = username.trim().replace(/^u\//i, "");
    if (!cleanUsername) return null;

    try {
      // Query recent posts and comments to deduce account metadata
      const [postsRes, commentsRes] = await Promise.all([
        this.getPosts({ author: cleanUsername, limit: 1 }),
        this.getComments({ author: cleanUsername, limit: 1 }),
      ]);

      if (postsRes.data.length === 0 && commentsRes.data.length === 0) {
        return null;
      }

      const samplePostRaw = (samplePost?.rawPayload || {}) as Record<string, any>;
      const sampleCommentRaw = (sampleComment?.rawPayload || {}) as Record<string, any>;

      const redditId = samplePost?.authorRedditId || sampleComment?.authorRedditId;
      const avatarUrl =
        (sampleComment?.rawPayload as ArcticShiftCommentRaw)?.profile_img || null;

      // Extract verified upstream karma if explicitly present in upstream payload
      const upstreamTotalKarma =
        typeof samplePostRaw.author_karma === "number"
          ? samplePostRaw.author_karma
          : typeof sampleCommentRaw.author_karma === "number"
          ? sampleCommentRaw.author_karma
          : typeof samplePostRaw.total_karma === "number"
          ? samplePostRaw.total_karma
          : typeof sampleCommentRaw.total_karma === "number"
          ? sampleCommentRaw.total_karma
          : null;

      const upstreamLinkKarma =
        typeof samplePostRaw.author_link_karma === "number"
          ? samplePostRaw.author_link_karma
          : typeof sampleCommentRaw.author_link_karma === "number"
          ? sampleCommentRaw.author_link_karma
          : typeof samplePostRaw.link_karma === "number"
          ? samplePostRaw.link_karma
          : null;

      const upstreamCommentKarma =
        typeof samplePostRaw.author_comment_karma === "number"
          ? samplePostRaw.author_comment_karma
          : typeof sampleCommentRaw.author_comment_karma === "number"
          ? sampleCommentRaw.author_comment_karma
          : typeof sampleCommentRaw.comment_karma === "number"
          ? sampleCommentRaw.comment_karma
          : null;

      // Extract verified account creation timestamp if provided by upstream source
      const upstreamCreatedEpoch =
        typeof samplePostRaw.author_created_utc === "number"
          ? samplePostRaw.author_created_utc
          : typeof sampleCommentRaw.author_created_utc === "number"
          ? sampleCommentRaw.author_created_utc
          : typeof samplePostRaw.account_created_utc === "number"
          ? samplePostRaw.account_created_utc
          : typeof sampleCommentRaw.account_created_utc === "number"
          ? sampleCommentRaw.account_created_utc
          : null;

      const createdUtc = upstreamCreatedEpoch ? new Date(upstreamCreatedEpoch * 1000) : null;

      // Extract archive observation bounds (strictly first_seen and last_seen in archive, NOT account creation)
      const dates = [
        samplePost ? samplePost.createdUtc.getTime() : null,
        sampleComment ? sampleComment.createdUtc.getTime() : null,
      ].filter((d): d is number => d !== null);

      const earliestTime = dates.length > 0 ? new Date(Math.min(...dates)) : null;
      const latestTime = dates.length > 0 ? new Date(Math.max(...dates)) : null;

      return {
        redditId,
        username: cleanUsername,
        avatarUrl,
        createdUtc, // Actual Reddit registration timestamp if provided by upstream, otherwise null
        firstSeenUtc: earliestTime, // First observed in archive coverage
        lastSeenUtc: latestTime, // Last observed in archive coverage
        totalKarma: upstreamTotalKarma,
        linkKarma: upstreamLinkKarma,
        commentKarma: upstreamCommentKarma,
        isSuspended: false,
        isDeleted: false,
      };
    } catch (err: any) {
      console.error(`[ArcticShift] getUserProfile error for ${cleanUsername}:`, err.message);
      return null;
    }
  }

  /**
   * Retrieve posts by author with pagination.
   */
  async getPosts(options: SearchQueryOptions): Promise<PaginatedResult<RedditPost>> {
    const limit = Math.min(options.limit || 100, 100);
    const params: Record<string, string | number | undefined> = {
      author: options.author?.trim().replace(/^u\//i, ""),
      subreddit: options.subreddit,
      limit,
      before: options.before,
      after: options.after,
      sort: options.sort || "desc",
    };

    const res = await this.fetchWithRetry<{ data: ArcticShiftPostRaw[] }>("/api/posts/search", params);
    const rawItems = res.data || [];

    const posts = rawItems.map(normalizePost);
    const hasMore = rawItems.length === limit;
    const nextBefore = rawItems.length > 0 ? rawItems[rawItems.length - 1].created_utc : undefined;

    return {
      data: posts,
      hasMore,
      nextBefore,
      totalFetched: posts.length,
    };
  }

  /**
   * Retrieve comments by author with pagination.
   */
  async getComments(options: SearchQueryOptions): Promise<PaginatedResult<RedditComment>> {
    const limit = Math.min(options.limit || 100, 100);
    const params: Record<string, string | number | undefined> = {
      author: options.author?.trim().replace(/^u\//i, ""),
      subreddit: options.subreddit,
      limit,
      before: options.before,
      after: options.after,
      sort: options.sort || "desc",
    };

    const res = await this.fetchWithRetry<{ data: ArcticShiftCommentRaw[] }>("/api/comments/search", params);
    const rawItems = res.data || [];

    const comments = rawItems.map(normalizeComment);
    const hasMore = rawItems.length === limit;
    const nextBefore = rawItems.length > 0 ? rawItems[rawItems.length - 1].created_utc : undefined;

    return {
      data: comments,
      hasMore,
      nextBefore,
      totalFetched: comments.length,
    };
  }

  /**
   * Health check against the Arctic Shift service.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const res = await this.fetchWithRetry<{ data: any[] }>("/api/posts/search", {
        limit: 1,
      });
      return Array.isArray(res.data);
    } catch {
      return false;
    }
  }
}

// Default singleton instance
export const defaultArcticShiftSource = new ArcticShiftDataSource();
