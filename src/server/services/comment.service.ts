import { IRedditDataSource } from "@/lib/datasource/reddit-data-source";
import { defaultArcticShiftSource } from "@/lib/datasource/arctic-shift-source";
import { CommentRepository, UserRepository } from "@/server/repositories";
import { RedditComment } from "@/lib/datasource/types";
import { CommentItem, ContentStatus } from "@/types";

export interface CommentsQueryFilter {
  page?: number;
  limit?: number;
  cursor?: string | number;
  before?: number;
  after?: number;
  sort?: "newest" | "oldest" | "score";
  status?: string;
  subreddit?: string;
  from?: number;
  to?: number;
  search?: string;
}

export interface CommentsQueryResult {
  comments: CommentItem[];
  pagination: {
    page?: number;
    limit: number;
    total: number;
    hasMore: boolean;
    nextCursor?: string | number;
    nextBefore?: number;
    nextAfter?: number;
  };
  source: "DATABASE" | "UPSTREAM";
}

export class CommentService {
  private dataSource: IRedditDataSource;

  constructor(dataSource: IRedditDataSource = defaultArcticShiftSource) {
    this.dataSource = dataSource;
  }

  /**
   * Queries comments by author with full filtering and pagination.
   */
  async queryComments(username: string, filter: CommentsQueryFilter = {}): Promise<CommentsQueryResult> {
    const page = filter.page || 1;
    const limit = Math.min(filter.limit || 50, 100);
    const offset = (page - 1) * limit;

    // 1. Try local PostgreSQL database first
    try {
      const user = await UserRepository.findByUsername(username);
      if (user) {
        const dbComments = await CommentRepository.findByAuthorId(user.id, {
          limit,
          offset,
          status: filter.status,
          subreddit: filter.subreddit,
          sort: filter.sort,
        });

        if (dbComments.length > 0) {
          const totalCount = await CommentRepository.countByAuthorId(user.id, filter.status);

          let mappedComments: CommentItem[] = dbComments.map((c) => ({
            id: c.redditId,
            redditId: c.redditId,
            postId: c.postRedditId,
            postRedditId: c.postRedditId,
            parentId: c.parentId,
            parentRedditId: c.parentId,
            author: c.authorUsername,
            authorUsername: c.authorUsername,
            subreddit: c.subredditName,
            subredditName: c.subredditName,
            body: c.body,
            permalink: c.permalink || undefined,
            score: c.score,
            createdUtc: c.createdUtc.toISOString(),
            editedUtc: c.editedUtc ? c.editedUtc.toISOString() : undefined,
            status: c.status as ContentStatus,
            isDistinguished: c.isDistinguished || undefined,
            isNsfw: c.isNsfw,
          }));

          if (filter.search) {
            const q = filter.search.toLowerCase();
            mappedComments = mappedComments.filter((c) => c.body.toLowerCase().includes(q));
          }

          const hasMore = offset + dbComments.length < totalCount;
          const nextCursor = hasMore ? String(page + 1) : undefined;

          return {
            comments: mappedComments,
            pagination: {
              page,
              limit,
              total: totalCount,
              hasMore,
              nextCursor,
            },
            source: "DATABASE",
          };
        }
      }
    } catch (dbErr: any) {
      console.warn(`[CommentService] DB query unavailable: ${dbErr.message}`);
    }

    // 2. Query upstream Arctic Shift with cursor-based pagination
    const isAsc = filter.sort === "oldest";
    let beforeParam: number | undefined;
    let afterParam: number | undefined;

    if (isAsc) {
      if (filter.cursor !== undefined) {
        afterParam = Number(filter.cursor);
      } else if (filter.after !== undefined) {
        afterParam = filter.after;
      } else if (filter.from !== undefined) {
        afterParam = filter.from;
      }
      beforeParam = filter.before !== undefined ? filter.before : filter.to;
    } else {
      if (filter.cursor !== undefined) {
        beforeParam = Number(filter.cursor);
      } else if (filter.before !== undefined) {
        beforeParam = filter.before;
      } else if (filter.to !== undefined) {
        beforeParam = filter.to;
      }
      afterParam = filter.after !== undefined ? filter.after : filter.from;
    }

    const upstreamRes = await this.dataSource.getComments({
      author: username,
      limit,
      subreddit: filter.subreddit,
      sort: isAsc ? "asc" : "desc",
      before: beforeParam,
      after: afterParam,
    });

    let items = upstreamRes.data.map(CommentService.toCommentItem);

    if (filter.status && filter.status !== "ALL") {
      items = items.filter((c) => c.status === filter.status);
    }

    if (filter.search) {
      const q = filter.search.toLowerCase();
      items = items.filter((c) => c.body.toLowerCase().includes(q));
    }

    const hasMore = upstreamRes.hasMore && upstreamRes.data.length > 0;
    const nextCursor = hasMore ? upstreamRes.nextCursor : undefined;

    return {
      comments: items,
      pagination: {
        page,
        limit,
        total: items.length,
        hasMore,
        nextCursor,
        nextBefore: upstreamRes.nextBefore,
        nextAfter: upstreamRes.nextAfter,
      },
      source: "UPSTREAM",
    };
  }

  /**
   * Syncs a batch of comments into the database for an author.
   */
  async syncComments(authorId: string, username: string, limit = 100): Promise<{ count: number; nextBefore?: number }> {
    const result = await this.dataSource.getComments({
      author: username,
      limit,
      sort: "desc",
    });

    if (result.data.length === 0) {
      return { count: 0 };
    }

    try {
      const inserts = result.data.map((comment) => ({
        redditId: comment.redditId,
        authorId,
        authorUsername: comment.authorUsername,
        postRedditId: comment.postRedditId,
        parentId: comment.parentId,
        subredditName: comment.subredditName,
        body: comment.body,
        permalink: comment.permalink,
        score: comment.score,
        createdUtc: comment.createdUtc,
        editedUtc: comment.editedUtc,
        status: comment.status,
        isDistinguished: comment.isDistinguished,
        isNsfw: comment.isNsfw,
        rawPayload: comment.rawPayload,
      }));

      await CommentRepository.insertBatch(inserts);
    } catch (dbErr: any) {
      console.warn(`[CommentService] Could not persist comments to DB: ${dbErr.message}`);
    }

    return {
      count: result.data.length,
      nextBefore: result.nextBefore,
    };
  }

  /**
   * Transforms RedditComment to client CommentItem format.
   */
  static toCommentItem(comment: RedditComment): CommentItem {
    return {
      id: comment.redditId,
      redditId: comment.redditId,
      postId: comment.postRedditId,
      postRedditId: comment.postRedditId,
      parentId: comment.parentId,
      parentRedditId: comment.parentId,
      author: comment.authorUsername,
      authorUsername: comment.authorUsername,
      subreddit: comment.subredditName,
      subredditName: comment.subredditName,
      body: comment.body,
      permalink: comment.permalink || undefined,
      score: comment.score,
      createdUtc: comment.createdUtc.toISOString(),
      editedUtc: comment.editedUtc ? comment.editedUtc.toISOString() : undefined,
      status: comment.status,
      isDistinguished: comment.isDistinguished || undefined,
      isNsfw: comment.isNsfw,
    };
  }
}

export const defaultCommentService = new CommentService();
