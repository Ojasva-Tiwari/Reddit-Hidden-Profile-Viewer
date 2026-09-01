import { IRedditDataSource } from "@/lib/datasource/reddit-data-source";
import { defaultArcticShiftSource } from "@/lib/datasource/arctic-shift-source";
import { CommentRepository } from "@/server/repositories";
import { RedditComment } from "@/lib/datasource/types";
import { CommentItem } from "@/types";

export class CommentService {
  private dataSource: IRedditDataSource;

  constructor(dataSource: IRedditDataSource = defaultArcticShiftSource) {
    this.dataSource = dataSource;
  }

  /**
   * Fetches comments for an author from the data source with pagination.
   */
  async fetchComments(username: string, limit = 25, before?: number) {
    return this.dataSource.getComments({
      author: username,
      limit,
      before,
      sort: "desc",
    });
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
    };
  }
}

export const defaultCommentService = new CommentService();
