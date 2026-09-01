import { IRedditDataSource } from "@/lib/datasource/reddit-data-source";
import { defaultArcticShiftSource } from "@/lib/datasource/arctic-shift-source";
import { ActivityDistribution } from "@/types";

export class ActivityService {
  private dataSource: IRedditDataSource;

  constructor(dataSource: IRedditDataSource = defaultArcticShiftSource) {
    this.dataSource = dataSource;
  }

  /**
   * Calculates multi-dimensional activity distribution from posts and comments.
   */
  async getActivityDistribution(username: string): Promise<ActivityDistribution> {
    const clean = username.trim().replace(/^u\//i, "");

    // Fetch recent posts and comments
    const [postsRes, commentsRes] = await Promise.all([
      this.dataSource.getPosts({ author: clean, limit: 100 }),
      this.dataSource.getComments({ author: clean, limit: 100 }),
    ]);

    const posts = postsRes.data;
    const comments = commentsRes.data;
    const allItems = [...posts, ...comments];

    // 1. Subreddit Aggregation
    const subredditMap = new Map<string, { count: number; score: number }>();
    for (const item of allItems) {
      const sub = item.subredditName || "other";
      const existing = subredditMap.get(sub) || { count: 0, score: 0 };
      existing.count += 1;
      existing.score += item.score || 0;
      subredditMap.set(sub, existing);
    }

    const totalCount = allItems.length || 1;
    const topSubreddits = Array.from(subredditMap.entries())
      .map(([name, stat]) => ({
        name,
        count: stat.count,
        score: stat.score,
        percentage: parseFloat(((stat.count / totalCount) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 2. Yearly Aggregation
    const yearMap = new Map<number, { posts: number; comments: number }>();
    for (const p of posts) {
      const yr = p.createdUtc.getFullYear();
      const curr = yearMap.get(yr) || { posts: 0, comments: 0 };
      curr.posts += 1;
      yearMap.set(yr, curr);
    }
    for (const c of comments) {
      const yr = c.createdUtc.getFullYear();
      const curr = yearMap.get(yr) || { posts: 0, comments: 0 };
      curr.comments += 1;
      yearMap.set(yr, curr);
    }

    const yearlyActivity = Array.from(yearMap.entries())
      .map(([year, stat]) => ({
        year,
        posts: stat.posts,
        comments: stat.comments,
      }))
      .sort((a, b) => a.year - b.year);

    // 3. Hourly Activity (UTC)
    const hourCounts = new Array(24).fill(0);
    for (const item of allItems) {
      const hour = item.createdUtc.getUTCHours();
      hourCounts[hour] += 1;
    }
    const hourlyActivityUtc = hourCounts.map((count, hour) => ({ hour, count }));

    // 4. Daily Activity (Day of Week)
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayCounts = new Array(7).fill(0);
    for (const item of allItems) {
      const day = item.createdUtc.getUTCDay();
      dayCounts[day] += 1;
    }
    const dailyActivity = days.map((day, idx) => ({ day, count: dayCounts[idx] }));

    return {
      topSubreddits,
      yearlyActivity,
      hourlyActivityUtc,
      dailyActivity,
    };
  }
}

export const defaultActivityService = new ActivityService();
