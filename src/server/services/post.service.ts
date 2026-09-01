import { IRedditDataSource } from "@/lib/datasource/reddit-data-source";
import { defaultArcticShiftSource } from "@/lib/datasource/arctic-shift-source";
import { PostRepository } from "@/server/repositories";
import { RedditPost } from "@/lib/datasource/types";
import { PostItem } from "@/types";

export class PostService {
  private dataSource: IRedditDataSource;

  constructor(dataSource: IRedditDataSource = defaultArcticShiftSource) {
    this.dataSource = dataSource;
  }

  /**
   * Fetches posts for an author from the data source with pagination.
   */
  async fetchPosts(username: string, limit = 25, before?: number) {
    return this.dataSource.getPosts({
      author: username,
      limit,
      before,
      sort: "desc",
    });
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
