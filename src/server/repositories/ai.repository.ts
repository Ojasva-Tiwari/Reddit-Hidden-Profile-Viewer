import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { aiInsights, evidenceLinks } from "@/db/schema";

export type AIInsightInsert = typeof aiInsights.$inferInsert;
export type AIInsightSelect = typeof aiInsights.$inferSelect;

export class AIRepository {
  static async insertInsight(data: AIInsightInsert): Promise<AIInsightSelect> {
    const results = await db
      .insert(aiInsights)
      .values(data)
      .onConflictDoUpdate({
        target: [aiInsights.userId, aiInsights.insightIndex],
        set: {
          category: data.category,
          title: data.title,
          finding: data.finding,
          confidence: data.confidence,
          classification: data.classification,
          reasoning: data.reasoning,
          modelVersion: data.modelVersion,
          generatedAt: new Date(),
        },
      })
      .returning();

    return results[0];
  }

  static async findByUserId(userId: string): Promise<AIInsightSelect[]> {
    return db
      .select()
      .from(aiInsights)
      .where(eq(aiInsights.userId, userId))
      .orderBy(asc(aiInsights.insightIndex));
  }

  static async findWithEvidence(userId: string) {
    return db.query.aiInsights.findMany({
      where: eq(aiInsights.userId, userId),
      orderBy: asc(aiInsights.insightIndex),
      with: {
        evidenceLinks: {
          with: {
            post: true,
            comment: true,
          },
        },
      },
    });
  }
}
