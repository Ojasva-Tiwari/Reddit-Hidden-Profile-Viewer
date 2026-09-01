import { eq } from "drizzle-orm";
import { db } from "@/db";
import { evidenceLinks } from "@/db/schema";

export type EvidenceLinkInsert = typeof evidenceLinks.$inferInsert;
export type EvidenceLinkSelect = typeof evidenceLinks.$inferSelect;

export class EvidenceRepository {
  static async insertEvidence(data: EvidenceLinkInsert): Promise<EvidenceLinkSelect> {
    const results = await db
      .insert(evidenceLinks)
      .values(data)
      .returning();

    return results[0];
  }

  static async findByInsightId(insightId: string): Promise<EvidenceLinkSelect[]> {
    return db
      .select()
      .from(evidenceLinks)
      .where(eq(evidenceLinks.insightId, insightId));
  }

  static async findByRedditFullname(fullname: string): Promise<EvidenceLinkSelect[]> {
    return db
      .select()
      .from(evidenceLinks)
      .where(eq(evidenceLinks.redditFullname, fullname));
  }
}
