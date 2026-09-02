import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  bigint,
  boolean,
  numeric,
  timestamp,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// ENUMS
// ============================================================================

export const contentStatusEnum = pgEnum("content_status", [
  "VISIBLE",
  "DELETED",
  "REMOVED",
  "EDITED",
  "DELETED_LATER",
  "INITIALLY_UNAVAILABLE",
]);

export const mediaStatusEnum = pgEnum("media_status", [
  "MEDIA_AVAILABLE",
  "ARCHIVED_COPY",
  "THUMBNAIL_AVAILABLE",
  "MEDIA_REFERENCE_ONLY",
  "MEDIA_UNAVAILABLE",
]);

export const confidenceLevelEnum = pgEnum("confidence_level", [
  "HIGH",
  "MEDIUM",
  "SPECULATIVE",
]);

export const claimClassificationEnum = pgEnum("claim_classification", [
  "EXPLICIT",
  "STRONGLY_SUPPORTED",
  "WEAK_INFERENCE",
]);

export const syncStatusEnum = pgEnum("sync_status", [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "PARTIAL",
  "FAILED",
]);

// ============================================================================
// TABLES
// ============================================================================

// 1. USERS (Profiles)
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    redditId: varchar("reddit_id", { length: 32 }).unique(),
    username: varchar("username", { length: 64 }).notNull().unique(),
    avatarUrl: text("avatar_url"),
    createdUtc: timestamp("created_utc", { withTimezone: true }),
    firstSeenUtc: timestamp("first_seen_utc", { withTimezone: true }),
    lastSeenUtc: timestamp("last_seen_utc", { withTimezone: true }),
    totalKarma: integer("total_karma"),
    linkKarma: integer("link_karma"),
    commentKarma: integer("comment_karma"),
    isSuspended: boolean("is_suspended").default(false).notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    syncStatus: syncStatusEnum("sync_status").default("PENDING").notNull(),
    syncProgressPercent: integer("sync_progress_percent").default(0).notNull(),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_users_username").on(table.username),
    index("idx_users_sync_status").on(table.syncStatus),
  ]
);

// 2. SUBREDDITS
export const subreddits = pgTable(
  "subreddits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    redditId: varchar("reddit_id", { length: 32 }).unique(),
    name: varchar("name", { length: 64 }).notNull().unique(),
    displayName: varchar("display_name", { length: 64 }).notNull(),
    isNsfw: boolean("is_nsfw").default(false).notNull(),
    isQuarantined: boolean("is_quarantined").default(false).notNull(),
    createdUtc: timestamp("created_utc", { withTimezone: true }),
    subscribersCount: bigint("subscribers_count", { mode: "number" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_subreddits_name").on(table.name),
  ]
);

// 3. POSTS
export const posts = pgTable(
  "posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    redditId: varchar("reddit_id", { length: 32 }).notNull().unique(),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "cascade" }),
    authorUsername: varchar("author_username", { length: 64 }).notNull(),
    subredditId: uuid("subreddit_id").references(() => subreddits.id, { onDelete: "set null" }),
    subredditName: varchar("subreddit_name", { length: 64 }).notNull(),
    title: text("title").notNull(),
    selftext: text("selftext").default("").notNull(),
    url: text("url"),
    permalink: text("permalink").notNull(),
    score: integer("score").default(0).notNull(),
    upvoteRatio: numeric("upvote_ratio", { precision: 4, scale: 3 }),
    numComments: integer("num_comments").default(0).notNull(),
    createdUtc: timestamp("created_utc", { withTimezone: true }).notNull(),
    editedUtc: timestamp("edited_utc", { withTimezone: true }),
    status: contentStatusEnum("status").default("VISIBLE").notNull(),
    mediaStatus: mediaStatusEnum("media_status").default("MEDIA_REFERENCE_ONLY").notNull(),
    isNsfw: boolean("is_nsfw").default(false).notNull(),
    isSpoiler: boolean("is_spoiler").default(false).notNull(),
    isLocked: boolean("is_locked").default(false).notNull(),
    rawPayload: jsonb("raw_payload"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_posts_author_created").on(table.authorId, table.createdUtc),
    index("idx_posts_subreddit").on(table.subredditId),
    index("idx_posts_status").on(table.status),
    index("idx_posts_score").on(table.score),
    index("idx_posts_reddit_id").on(table.redditId),
  ]
);

// 4. COMMENTS
export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    redditId: varchar("reddit_id", { length: 32 }).notNull().unique(),
    postId: uuid("post_id").references(() => posts.id, { onDelete: "set null" }),
    postRedditId: varchar("post_reddit_id", { length: 32 }).notNull(),
    parentId: varchar("parent_id", { length: 32 }).notNull(),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "cascade" }),
    authorUsername: varchar("author_username", { length: 64 }).notNull(),
    subredditId: uuid("subreddit_id").references(() => subreddits.id, { onDelete: "set null" }),
    subredditName: varchar("subreddit_name", { length: 64 }).notNull(),
    body: text("body").notNull(),
    permalink: text("permalink"),
    score: integer("score").default(0).notNull(),
    createdUtc: timestamp("created_utc", { withTimezone: true }).notNull(),
    editedUtc: timestamp("edited_utc", { withTimezone: true }),
    status: contentStatusEnum("status").default("VISIBLE").notNull(),
    isDistinguished: varchar("is_distinguished", { length: 16 }),
    isNsfw: boolean("is_nsfw").default(false).notNull(),
    rawPayload: jsonb("raw_payload"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_comments_author_created").on(table.authorId, table.createdUtc),
    index("idx_comments_post").on(table.postId),
    index("idx_comments_status").on(table.status),
    index("idx_comments_reddit_id").on(table.redditId),
    index("idx_comments_parent").on(table.parentId),
  ]
);

// 5. PROVENANCE METADATA
export const provenanceMetadata = pgTable(
  "provenance_metadata",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    targetType: varchar("target_type", { length: 16 }).notNull(), // 'POST' or 'COMMENT'
    targetId: uuid("target_id").notNull(),
    targetRedditId: varchar("target_reddit_id", { length: 32 }).notNull(),
    versionNumber: integer("version_number").default(1).notNull(),
    statusAtSnapshot: contentStatusEnum("status_at_snapshot").notNull(),
    previousContent: text("previous_content"),
    currentContent: text("current_content"),
    diffPatch: text("diff_patch"),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
    sourceOrigin: varchar("source_origin", { length: 64 }).notNull(),
  },
  (table) => [
    index("idx_provenance_target").on(table.targetType, table.targetId),
    index("idx_provenance_reddit_id").on(table.targetRedditId),
  ]
);

// 6. MEDIA REFERENCES
export const mediaReferences = pgTable(
  "media_references",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
    mediaUrl: text("media_url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    archiveUrl: text("archive_url"),
    mediaType: varchar("media_type", { length: 32 }),
    status: mediaStatusEnum("status").default("MEDIA_REFERENCE_ONLY").notNull(),
    httpStatusCode: integer("http_status_code"),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_media_post").on(table.postId),
    index("idx_media_status").on(table.status),
  ]
);

// 7. ACTIVITY AGGREGATES
export const activityAggregates = pgTable(
  "activity_aggregates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    periodType: varchar("period_type", { length: 16 }).notNull(), // 'YEAR', 'MONTH', 'SUBREDDIT', 'DAY_OF_WEEK', 'HOUR_OF_DAY'
    periodKey: varchar("period_key", { length: 64 }).notNull(),
    postCount: integer("post_count").default(0).notNull(),
    commentCount: integer("comment_count").default(0).notNull(),
    deletedPostCount: integer("deleted_post_count").default(0).notNull(),
    deletedCommentCount: integer("deleted_comment_count").default(0).notNull(),
    removedPostCount: integer("removed_post_count").default(0).notNull(),
    removedCommentCount: integer("removed_comment_count").default(0).notNull(),
    totalScore: bigint("total_score", { mode: "number" }).default(0).notNull(),
    calculatedAt: timestamp("calculated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_activity_user_period").on(table.userId, table.periodType, table.periodKey),
  ]
);

// 8. AI INSIGHTS ("30 Things")
export const aiInsights = pgTable(
  "ai_insights",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    insightIndex: integer("insight_index").notNull(),
    category: varchar("category", { length: 64 }).notNull(),
    title: varchar("title", { length: 256 }).notNull(),
    finding: text("finding").notNull(),
    confidence: confidenceLevelEnum("confidence").notNull(),
    classification: claimClassificationEnum("classification").notNull(),
    reasoning: text("reasoning").notNull(),
    modelVersion: varchar("model_version", { length: 64 }).notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_ai_insights_user_index").on(table.userId, table.insightIndex),
  ]
);

// 9. EVIDENCE LINKS
export const evidenceLinks = pgTable(
  "evidence_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    insightId: uuid("insight_id").references(() => aiInsights.id, { onDelete: "cascade" }).notNull(),
    postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
    commentId: uuid("comment_id").references(() => comments.id, { onDelete: "cascade" }),
    redditFullname: varchar("reddit_fullname", { length: 32 }).notNull(),
    quoteSnippet: text("quote_snippet").notNull(),
    relevanceScore: numeric("relevance_score", { precision: 3, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_evidence_insight").on(table.insightId),
    index("idx_evidence_post").on(table.postId),
    index("idx_evidence_comment").on(table.commentId),
  ]
);

// ============================================================================
// DRIZZLE RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  activityAggregates: many(activityAggregates),
  aiInsights: many(aiInsights),
}));

export const subredditsRelations = relations(subreddits, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  subreddit: one(subreddits, {
    fields: [posts.subredditId],
    references: [subreddits.id],
  }),
  comments: many(comments),
  mediaReferences: many(mediaReferences),
  evidenceLinks: many(evidenceLinks),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  subreddit: one(subreddits, {
    fields: [comments.subredditId],
    references: [subreddits.id],
  }),
  evidenceLinks: many(evidenceLinks),
}));

export const aiInsightsRelations = relations(aiInsights, ({ one, many }) => ({
  user: one(users, {
    fields: [aiInsights.userId],
    references: [users.id],
  }),
  evidenceLinks: many(evidenceLinks),
}));

export const evidenceLinksRelations = relations(evidenceLinks, ({ one }) => ({
  insight: one(aiInsights, {
    fields: [evidenceLinks.insightId],
    references: [aiInsights.id],
  }),
  post: one(posts, {
    fields: [evidenceLinks.postId],
    references: [posts.id],
  }),
  comment: one(comments, {
    fields: [evidenceLinks.commentId],
    references: [comments.id],
  }),
}));
