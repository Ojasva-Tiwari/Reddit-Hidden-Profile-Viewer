import { eq, and, desc, asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { posts, subreddits } from "@/db/schema";

export type PostInsert = typeof posts.$inferInsert;
export type PostSelect = typeof posts.$inferSelect;

export interface PostQueryOptions {
  limit?: number;
  offset?: number;
  status?: string;
  subreddit?: string;
  sort?: "newest" | "oldest" | "score" | "comments";
}

export class PostRepository {
  static async insertPost(data: PostInsert): Promise<PostSelect> {
    const results = await db
      .insert(posts)
      .values(data)
      .onConflictDoUpdate({
        target: posts.redditId,
        set: {
          title: data.title,
          selftext: data.selftext,
          score: data.score,
          numComments: data.numComments,
          editedUtc: data.editedUtc,
          status: data.status,
          mediaStatus: data.mediaStatus,
          updatedAt: new Date(),
        },
      })
      .returning();

    return results[0];
  }

  static async insertBatch(items: PostInsert[]): Promise<void> {
    if (items.length === 0) return;
    await db
      .insert(posts)
      .values(items)
      .onConflictDoNothing({ target: posts.redditId });
  }

  static async findByRedditId(redditId: string): Promise<PostSelect | null> {
    const results = await db
      .select()
      .from(posts)
      .where(eq(posts.redditId, redditId))
      .limit(1);

    return results[0] || null;
  }

  static async findByAuthorId(authorId: string, options: PostQueryOptions = {}): Promise<PostSelect[]> {
    const { limit = 25, offset = 0, status, subreddit, sort = "newest" } = options;

    const conditions = [eq(posts.authorId, authorId)];

    if (status && status !== "ALL") {
      conditions.push(eq(posts.status, status as any));
    }

    if (subreddit) {
      conditions.push(sql`LOWER(${posts.subredditName}) = LOWER(${subreddit})`);
    }

    let orderByClause = desc(posts.createdUtc);
    if (sort === "oldest") orderByClause = asc(posts.createdUtc);
    if (sort === "score") orderByClause = desc(posts.score);
    if (sort === "comments") orderByClause = desc(posts.numComments);

    return db
      .select()
      .from(posts)
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);
  }

  static async countByAuthorId(authorId: string, status?: string): Promise<number> {
    const conditions = [eq(posts.authorId, authorId)];
    if (status && status !== "ALL") {
      conditions.push(eq(posts.status, status as any));
    }

    const results = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(posts)
      .where(and(...conditions));

    return results[0]?.count || 0;
  }
}
