import { eq, and, desc, asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { comments } from "@/db/schema";

export type CommentInsert = typeof comments.$inferInsert;
export type CommentSelect = typeof comments.$inferSelect;

export interface CommentQueryOptions {
  limit?: number;
  offset?: number;
  status?: string;
  subreddit?: string;
  sort?: "newest" | "oldest" | "score";
}

export class CommentRepository {
  static async insertComment(data: CommentInsert): Promise<CommentSelect> {
    const results = await db
      .insert(comments)
      .values(data)
      .onConflictDoUpdate({
        target: comments.redditId,
        set: {
          body: data.body,
          score: data.score,
          editedUtc: data.editedUtc,
          status: data.status,
          isNsfw: data.isNsfw,
          updatedAt: new Date(),
        },
      })
      .returning();

    return results[0];
  }

  static async insertBatch(items: CommentInsert[]): Promise<void> {
    if (items.length === 0) return;
    await db
      .insert(comments)
      .values(items)
      .onConflictDoNothing({ target: comments.redditId });
  }

  static async findByRedditId(redditId: string): Promise<CommentSelect | null> {
    const results = await db
      .select()
      .from(comments)
      .where(eq(comments.redditId, redditId))
      .limit(1);

    return results[0] || null;
  }

  static async findByAuthorId(authorId: string, options: CommentQueryOptions = {}): Promise<CommentSelect[]> {
    const { limit = 25, offset = 0, status, subreddit, sort = "newest" } = options;

    const conditions = [eq(comments.authorId, authorId)];

    if (status && status !== "ALL") {
      conditions.push(eq(comments.status, status as any));
    }

    if (subreddit) {
      conditions.push(sql`LOWER(${comments.subredditName}) = LOWER(${subreddit})`);
    }

    let orderByClause = desc(comments.createdUtc);
    if (sort === "oldest") orderByClause = asc(comments.createdUtc);
    if (sort === "score") orderByClause = desc(comments.score);

    return db
      .select()
      .from(comments)
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);
  }

  static async countByAuthorId(authorId: string, status?: string): Promise<number> {
    const conditions = [eq(comments.authorId, authorId)];
    if (status && status !== "ALL") {
      conditions.push(eq(comments.status, status as any));
    }

    const results = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(comments)
      .where(and(...conditions));

    return results[0]?.count || 0;
  }
}
