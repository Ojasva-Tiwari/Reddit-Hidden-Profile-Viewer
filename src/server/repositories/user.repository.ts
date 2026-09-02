import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export type UserInsert = typeof users.$inferInsert;
export type UserSelect = typeof users.$inferSelect;

export class UserRepository {
  static async findByUsername(username: string): Promise<UserSelect | null> {
    const results = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.username}) = LOWER(${username})`)
      .limit(1);

    return results[0] || null;
  }

  static async findById(id: string): Promise<UserSelect | null> {
    const results = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return results[0] || null;
  }

  static async upsertUser(data: UserInsert): Promise<UserSelect> {
    const results = await db
      .insert(users)
      .values(data)
      .onConflictDoUpdate({
        target: users.username,
        set: {
          redditId: data.redditId ?? sql`users.reddit_id`,
          avatarUrl: data.avatarUrl ?? sql`users.avatar_url`,
          createdUtc: data.createdUtc ?? sql`users.created_utc`,
          totalKarma: data.totalKarma ?? sql`users.total_karma`,
          linkKarma: data.linkKarma ?? sql`users.link_karma`,
          commentKarma: data.commentKarma ?? sql`users.comment_karma`,
          firstSeenUtc: data.firstSeenUtc ?? sql`users.first_seen_utc`,
          lastSeenUtc: data.lastSeenUtc ?? sql`users.last_seen_utc`,
          syncStatus: data.syncStatus ?? sql`users.sync_status`,
          syncProgressPercent: data.syncProgressPercent ?? sql`users.sync_progress_percent`,
          lastSyncedAt: data.lastSyncedAt ?? sql`users.last_synced_at`,
          updatedAt: new Date(),
        },
      })
      .returning();

    return results[0];
  }

  static async updateSyncStatus(
    id: string,
    syncStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "PARTIAL" | "FAILED",
    syncProgressPercent: number
  ): Promise<void> {
    await db
      .update(users)
      .set({
        syncStatus,
        syncProgressPercent,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }
}
