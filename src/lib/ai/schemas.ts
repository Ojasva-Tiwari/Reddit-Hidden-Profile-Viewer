import { z } from "zod";

export const InsightCategoryEnum = z.enum([
  "INTERESTS",
  "MEDIA",
  "FOOD",
  "GAMES",
  "HOBBIES",
  "COMMUNITIES",
  "ACTIVITY",
  "COMMUNICATION",
  "TIMELINE",
  "NOTABLE_PUBLIC_EVENTS",
]);

export type InsightCategory = z.infer<typeof InsightCategoryEnum>;

export const InsightClassificationEnum = z.enum([
  "EXPLICIT",
  "STRONGLY_SUPPORTED",
  "WEAK_INFERENCE",
]);

export type InsightClassification = z.infer<typeof InsightClassificationEnum>;

export const InsightConfidenceEnum = z.enum(["HIGH", "MEDIUM", "SPECULATIVE"]);

export type InsightConfidence = z.infer<typeof InsightConfidenceEnum>;

export const InsightItemSchema = z.object({
  id: z.string(),
  number: z.number().int().min(1).max(30),
  category: InsightCategoryEnum,
  title: z.string().min(3).max(120),
  finding: z.string().min(10).max(500),
  classification: InsightClassificationEnum,
  confidence: InsightConfidenceEnum,
  evidenceIds: z.array(z.string()).min(1),
  supportingEntities: z.array(z.string()).optional(),
  timeRange: z.string().optional(),
  subredditContext: z.string().optional(),
});

export type InsightItem = z.infer<typeof InsightItemSchema>;

export const ProfileSummaryOutputSchema = z.object({
  username: z.string(),
  totalInsights: z.number().int().min(0).max(30),
  generatedAt: z.string(),
  modelVersion: z.string(),
  schemaVersion: z.string().default("1"),
  insights: z.array(InsightItemSchema),
});

export type ProfileSummaryOutput = z.infer<typeof ProfileSummaryOutputSchema>;
