import { IRedditDataSource } from "@/lib/datasource/reddit-data-source";
import { defaultArcticShiftSource } from "@/lib/datasource/arctic-shift-source";
import { PostRepository, UserRepository } from "@/server/repositories";
import { RedditPost } from "@/lib/datasource/types";
import { PostItem, ContentStatus } from "@/types";

export interface PostsQueryFilter {
  page?: number;
  limit?: number;
  sort?: "newest" | "oldest" | "score" | "comments";
  status?: string;
  subreddit?: string;
  from?: number; // epoch seconds
  to?: number;
  search?: string;
  hasMedia?: string;
}

export interface PostsQueryResult {
  posts: PostItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  source: "DATABASE" | "UPSTREAM";
}

export class PostService {
  private dataSource: IRedditDataSource;

  constructor(dataSource: IRedditDataSource = defaultArcticShiftSource) {
    this.dataSource = dataSource;
  }

  /**
   * Queries posts by author, supporting both local database cache and upstream queries.
   */
  async queryPosts(username: string, filter: PostsQueryFilter = {}): Promise<PostsQueryResult> {
    const page = filter.page || 1;
    const limit = Math.min(filter.limit || 25, 100);
    const offset = (page - 1) * limit;

    // 1. Try fetching from local database if author exists in DB
    try {
      const user = await UserRepository.findByUsername(username);
      if (user) {
        const dbPosts = await PostRepository.findByAuthorId(user.id, {
          limit,
          offset,
          status: filter.status,
          subreddit: filter.subreddit,
          sort: filter.sort,
        });

        if (dbPosts.length > 0) {
          const totalCount = await PostRepository.countByAuthorId(user.id, filter.status);

          let mappedPosts: PostItem[] = dbPosts.map((p) => ({
            id: p.redditId,
            redditId: p.redditId,
            author: p.authorUsername,
            authorUsername: p.authorUsername,
            subreddit: p.subredditName,
            subredditName: p.subredditName,
            title: p.title,
            selftext: p.selftext,
            url: p.url || undefined,
            permalink: p.permalink,
            score: p.score,
            upvoteRatio: p.upvoteRatio ? parseFloat(p.upvoteRatio) : undefined,
            numComments: p.numComments,
            createdUtc: p.createdUtc.toISOString(),
            editedUtc: p.editedUtc ? p.editedUtc.toISOString() : undefined,
            status: p.status as ContentStatus,
            mediaStatus: p.mediaStatus,
            isNsfw: p.isNsfw,
            isSpoiler: p.isSpoiler,
            isLocked: p.isLocked,
          }));

          // Optional keyword search filter in-memory if requested
          if (filter.search) {
            const q = filter.search.toLowerCase();
            mappedPosts = mappedPosts.filter(
              (p) => p.title.toLowerCase().includes(q) || p.selftext.toLowerCase().includes(q)
            );
          }

          return {
            posts: mappedPosts,
            pagination: {
              page,
              limit,
              total: totalCount,
              hasMore: offset + dbPosts.length < totalCount,
            },
            source: "DATABASE",
          };
        }
      }
    } catch (dbErr: any) {
      console.warn(`[PostService] DB query unavailable: ${dbErr.message}`);
    }

    // 2. Fetch live from Arctic Shift
    const upstreamRes = await this.dataSource.getPosts({
      author: username,
      limit,
      subreddit: filter.subreddit,
      sort: filter.sort === "oldest" ? "asc" : "desc",
      before: filter.to,
      after: filter.from,
    });

    let items = upstreamRes.data.map(PostService.toPostItem);

    // Apply status filter
    if (filter.status && filter.status !== "ALL") {
      items = items.filter((p) => p.status === filter.status);
    }

    // Apply keyword search
    if (filter.search) {
      const q = filter.search.toLowerCase();
      items = items.filter(
        (p) => p.title.toLowerCase().includes(q) || p.selftext.toLowerCase().includes(q)
      );
    }

    // Apply media filter
    if (filter.hasMedia === "true") {
      items = items.filter((p) => p.mediaStatus === "MEDIA_AVAILABLE" || p.mediaStatus === "THUMBNAIL_AVAILABLE");
    } else if (filter.hasMedia === "false") {
      items = items.filter((p) => p.mediaStatus !== "MEDIA_AVAILABLE" && p.mediaStatus !== "THUMBNAIL_AVAILABLE");
    }

    return {
      posts: items,
      pagination: {
        page,
        limit,
        total: items.length,
        hasMore: upstreamRes.hasMore,
      },
      source: "UPSTREAM",
    };
  }

  /**
   * Syncs a batch of posts into the database for an author.
   */
  async syncPosts(authorId: string, username: string, limit = 100): Promise<{ count: number; nextBefore?: number }> {
    const result = await this.dataSource.getPosts({
      author: username,
      limit,
      sort: "desc",
    });

    if (result.data.length === 0) {
      return { count: 0 };
    }

    try {
      const inserts = result.data.map((post) => ({
        redditId: post.redditId,
        authorId,
        authorUsername: post.authorUsername,
        subredditName: post.subredditName,
        title: post.title,
        selftext: post.selftext,
        url: post.url,
        permalink: post.permalink,
        score: post.score,
        upvoteRatio: post.upvoteRatio ? String(post.upvoteRatio) : null,
        numComments: post.numComments,
        createdUtc: post.createdUtc,
        editedUtc: post.editedUtc,
        status: post.status,
        mediaStatus: post.mediaStatus,
        isNsfw: post.isNsfw,
        isSpoiler: post.isSpoiler,
        isLocked: post.isLocked,
        rawPayload: post.rawPayload,
      }));

      await PostRepository.insertBatch(inserts);
    } catch (dbErr: any) {
      console.warn(`[PostService] Could not persist posts to DB: ${dbErr.message}`);
    }

    return {
      count: result.data.length,
      nextBefore: result.nextBefore,
    };
  }

  /**
   * Transforms RedditPost to client PostItem format.
   */
  static toPostItem(post: RedditPost): PostItem {
    return {
      id: post.redditId,
      redditId: post.redditId,
      author: post.authorUsername,
      authorUsername: post.authorUsername,
      subreddit: post.subredditName,
      subredditName: post.subredditName,
      title: post.title,
      selftext: post.selftext,
      url: post.url || undefined,
      permalink: post.permalink,
      score: post.score,
      upvoteRatio: post.upvoteRatio || undefined,
      numComments: post.numComments,
      createdUtc: post.createdUtc.toISOString(),
      editedUtc: post.editedUtc ? post.editedUtc.toISOString() : undefined,
      status: post.status,
      mediaStatus: post.mediaStatus,
      isNsfw: post.isNsfw,
      isSpoiler: post.isSpoiler,
      isLocked: post.isLocked,
    };
  }
}

export const defaultPostService = new PostService();
