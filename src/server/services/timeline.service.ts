import { IRedditDataSource } from "@/lib/datasource/reddit-data-source";
import { defaultArcticShiftSource } from "@/lib/datasource/arctic-shift-source";
import { TimelineEvent } from "@/types";

export interface TimelineQueryOptions {
  limit?: number;
  sort?: "newest" | "oldest";
  type?: "ALL" | "POST" | "COMMENT";
  status?: string;
  subreddit?: string;
  year?: number;
}

export class TimelineService {
  private dataSource: IRedditDataSource;

  constructor(dataSource: IRedditDataSource = defaultArcticShiftSource) {
    this.dataSource = dataSource;
  }

  /**
   * Retrieves and merges submissions and comments into a chronological timeline.
   */
  async getTimeline(username: string, options: TimelineQueryOptions = {}): Promise<TimelineEvent[]> {
    const clean = username.trim().replace(/^u\//i, "");
    const limit = Math.min(options.limit || 50, 100);

    const [postsRes, commentsRes] = await Promise.all([
      options.type === "COMMENT"
        ? Promise.resolve({ data: [] })
        : this.dataSource.getPosts({ author: clean, limit, subreddit: options.subreddit }),
      options.type === "POST"
        ? Promise.resolve({ data: [] })
        : this.dataSource.getComments({ author: clean, limit, subreddit: options.subreddit }),
    ]);

    const events: TimelineEvent[] = [];

    // Map Posts
    for (const post of postsRes.data) {
      if (options.status && options.status !== "ALL" && post.status !== options.status) {
        continue;
      }
      if (options.year && post.createdUtc.getFullYear() !== options.year) {
        continue;
      }

      events.push({
        id: post.redditId,
        redditId: post.redditId,
        year: post.createdUtc.getFullYear(),
        dateStr: post.createdUtc.toISOString().split("T")[0],
        type: "POST",
        title: post.title,
        subreddit: post.subredditName,
        status: post.status,
        snippet: post.selftext ? post.selftext.substring(0, 140) + "..." : post.title,
        score: post.score,
        isNsfw: post.isNsfw,
      });
    }

    // Map Comments
    for (const comment of commentsRes.data) {
      if (options.status && options.status !== "ALL" && comment.status !== options.status) {
        continue;
      }
      if (options.year && comment.createdUtc.getFullYear() !== options.year) {
        continue;
      }

      events.push({
        id: comment.redditId,
        redditId: comment.redditId,
        year: comment.createdUtc.getFullYear(),
        dateStr: comment.createdUtc.toISOString().split("T")[0],
        type: "COMMENT",
        title: `Comment in r/${comment.subredditName}`,
        subreddit: comment.subredditName,
        status: comment.status,
        snippet: comment.body.substring(0, 140) + "...",
        score: comment.score,
        isNsfw: comment.isNsfw,
      });
    }

    // Deterministic sort with tie-breaking on redditId
    events.sort((a, b) => {
      const dateA = new Date(a.dateStr).getTime();
      const dateB = new Date(b.dateStr).getTime();
      if (dateA !== dateB) {
        return options.sort === "oldest" ? dateA - dateB : dateB - dateA;
      }
      return options.sort === "oldest" ? a.redditId.localeCompare(b.redditId) : b.redditId.localeCompare(a.redditId);
    });

    return events.slice(0, limit);
  }
}

export const defaultTimelineService = new TimelineService();
