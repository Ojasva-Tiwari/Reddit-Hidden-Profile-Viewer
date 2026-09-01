import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { activityAggregates } from "@/db/schema";

export type ActivityAggregateInsert = typeof activityAggregates.$inferInsert;
export type ActivityAggregateSelect = typeof activityAggregates.$inferSelect;

export class ActivityRepository {
  static async upsertAggregate(data: ActivityAggregateInsert): Promise<ActivityAggregateSelect> {
    const results = await db
      .insert(activityAggregates)
      .values(data)
      .onConflictDoUpdate({
        target: [activityAggregates.userId, activityAggregates.periodType, activityAggregates.periodKey],
        set: {
          postCount: data.postCount,
          commentCount: data.commentCount,
          deletedPostCount: data.deletedPostCount,
          deletedCommentCount: data.deletedCommentCount,
          removedPostCount: data.removedPostCount,
          removedCommentCount: data.removedCommentCount,
          totalScore: data.totalScore,
          calculatedAt: new Date(),
        },
      })
      .returning();

    return results[0];
  }

  static async findByUserAndType(userId: string, periodType: string): Promise<ActivityAggregateSelect[]> {
    return db
      .select()
      .from(activityAggregates)
      .where(
        and(
          eq(activityAggregates.userId, userId),
          eq(activityAggregates.periodType, periodType)
        )
      )
      .orderBy(desc(activityAggregates.postCount));
  }

  static async findSummaryByUserId(userId: string): Promise<ActivityAggregateSelect[]> {
    return db
      .select()
      .from(activityAggregates)
      .where(eq(activityAggregates.userId, userId));
  }
}
