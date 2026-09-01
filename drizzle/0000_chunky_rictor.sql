CREATE TYPE "public"."claim_classification" AS ENUM('EXPLICIT', 'STRONGLY_SUPPORTED', 'WEAK_INFERENCE');--> statement-breakpoint
CREATE TYPE "public"."confidence_level" AS ENUM('HIGH', 'MEDIUM', 'SPECULATIVE');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('VISIBLE', 'DELETED', 'REMOVED', 'EDITED', 'DELETED_LATER', 'INITIALLY_UNAVAILABLE');--> statement-breakpoint
CREATE TYPE "public"."media_status" AS ENUM('MEDIA_AVAILABLE', 'ARCHIVED_COPY', 'THUMBNAIL_AVAILABLE', 'MEDIA_REFERENCE_ONLY', 'MEDIA_UNAVAILABLE');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'PARTIAL', 'FAILED');--> statement-breakpoint
CREATE TABLE "activity_aggregates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"period_type" varchar(16) NOT NULL,
	"period_key" varchar(64) NOT NULL,
	"post_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"deleted_post_count" integer DEFAULT 0 NOT NULL,
	"deleted_comment_count" integer DEFAULT 0 NOT NULL,
	"removed_post_count" integer DEFAULT 0 NOT NULL,
	"removed_comment_count" integer DEFAULT 0 NOT NULL,
	"total_score" bigint DEFAULT 0 NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"insight_index" integer NOT NULL,
	"category" varchar(64) NOT NULL,
	"title" varchar(256) NOT NULL,
	"finding" text NOT NULL,
	"confidence" "confidence_level" NOT NULL,
	"classification" "claim_classification" NOT NULL,
	"reasoning" text NOT NULL,
	"model_version" varchar(64) NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reddit_id" varchar(32) NOT NULL,
	"post_id" uuid,
	"post_reddit_id" varchar(32) NOT NULL,
	"parent_id" varchar(32) NOT NULL,
	"author_id" uuid,
	"author_username" varchar(64) NOT NULL,
	"subreddit_id" uuid,
	"subreddit_name" varchar(64) NOT NULL,
	"body" text NOT NULL,
	"permalink" text,
	"score" integer DEFAULT 0 NOT NULL,
	"created_utc" timestamp with time zone NOT NULL,
	"edited_utc" timestamp with time zone,
	"status" "content_status" DEFAULT 'VISIBLE' NOT NULL,
	"is_distinguished" varchar(16),
	"raw_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comments_reddit_id_unique" UNIQUE("reddit_id")
);
--> statement-breakpoint
CREATE TABLE "evidence_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"insight_id" uuid NOT NULL,
	"post_id" uuid,
	"comment_id" uuid,
	"reddit_fullname" varchar(32) NOT NULL,
	"quote_snippet" text NOT NULL,
	"relevance_score" numeric(3, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid,
	"media_url" text NOT NULL,
	"thumbnail_url" text,
	"archive_url" text,
	"media_type" varchar(32),
	"status" "media_status" DEFAULT 'MEDIA_REFERENCE_ONLY' NOT NULL,
	"http_status_code" integer,
	"last_checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reddit_id" varchar(32) NOT NULL,
	"author_id" uuid,
	"author_username" varchar(64) NOT NULL,
	"subreddit_id" uuid,
	"subreddit_name" varchar(64) NOT NULL,
	"title" text NOT NULL,
	"selftext" text DEFAULT '' NOT NULL,
	"url" text,
	"permalink" text NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"upvote_ratio" numeric(4, 3),
	"num_comments" integer DEFAULT 0 NOT NULL,
	"created_utc" timestamp with time zone NOT NULL,
	"edited_utc" timestamp with time zone,
	"status" "content_status" DEFAULT 'VISIBLE' NOT NULL,
	"media_status" "media_status" DEFAULT 'MEDIA_REFERENCE_ONLY' NOT NULL,
	"is_nsfw" boolean DEFAULT false NOT NULL,
	"is_spoiler" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"raw_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_reddit_id_unique" UNIQUE("reddit_id")
);
--> statement-breakpoint
CREATE TABLE "provenance_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_type" varchar(16) NOT NULL,
	"target_id" uuid NOT NULL,
	"target_reddit_id" varchar(32) NOT NULL,
	"version_number" integer DEFAULT 1 NOT NULL,
	"status_at_snapshot" "content_status" NOT NULL,
	"previous_content" text,
	"current_content" text,
	"diff_patch" text,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source_origin" varchar(64) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subreddits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reddit_id" varchar(32),
	"name" varchar(64) NOT NULL,
	"display_name" varchar(64) NOT NULL,
	"is_nsfw" boolean DEFAULT false NOT NULL,
	"is_quarantined" boolean DEFAULT false NOT NULL,
	"created_utc" timestamp with time zone,
	"subscribers_count" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subreddits_reddit_id_unique" UNIQUE("reddit_id"),
	CONSTRAINT "subreddits_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reddit_id" varchar(32),
	"username" varchar(64) NOT NULL,
	"avatar_url" text,
	"created_utc" timestamp with time zone,
	"first_seen_utc" timestamp with time zone,
	"last_seen_utc" timestamp with time zone,
	"total_karma" integer DEFAULT 0 NOT NULL,
	"link_karma" integer DEFAULT 0 NOT NULL,
	"comment_karma" integer DEFAULT 0 NOT NULL,
	"is_suspended" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"sync_status" "sync_status" DEFAULT 'PENDING' NOT NULL,
	"sync_progress_percent" integer DEFAULT 0 NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_reddit_id_unique" UNIQUE("reddit_id"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "activity_aggregates" ADD CONSTRAINT "activity_aggregates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_subreddit_id_subreddits_id_fk" FOREIGN KEY ("subreddit_id") REFERENCES "public"."subreddits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_links" ADD CONSTRAINT "evidence_links_insight_id_ai_insights_id_fk" FOREIGN KEY ("insight_id") REFERENCES "public"."ai_insights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_links" ADD CONSTRAINT "evidence_links_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_links" ADD CONSTRAINT "evidence_links_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_references" ADD CONSTRAINT "media_references_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_subreddit_id_subreddits_id_fk" FOREIGN KEY ("subreddit_id") REFERENCES "public"."subreddits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_activity_user_period" ON "activity_aggregates" USING btree ("user_id","period_type","period_key");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ai_insights_user_index" ON "ai_insights" USING btree ("user_id","insight_index");--> statement-breakpoint
CREATE INDEX "idx_comments_author_created" ON "comments" USING btree ("author_id","created_utc");--> statement-breakpoint
CREATE INDEX "idx_comments_post" ON "comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_comments_status" ON "comments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_comments_reddit_id" ON "comments" USING btree ("reddit_id");--> statement-breakpoint
CREATE INDEX "idx_comments_parent" ON "comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_evidence_insight" ON "evidence_links" USING btree ("insight_id");--> statement-breakpoint
CREATE INDEX "idx_evidence_post" ON "evidence_links" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_evidence_comment" ON "evidence_links" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "idx_media_post" ON "media_references" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_media_status" ON "media_references" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_posts_author_created" ON "posts" USING btree ("author_id","created_utc");--> statement-breakpoint
CREATE INDEX "idx_posts_subreddit" ON "posts" USING btree ("subreddit_id");--> statement-breakpoint
CREATE INDEX "idx_posts_status" ON "posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_posts_score" ON "posts" USING btree ("score");--> statement-breakpoint
CREATE INDEX "idx_posts_reddit_id" ON "posts" USING btree ("reddit_id");--> statement-breakpoint
CREATE INDEX "idx_provenance_target" ON "provenance_metadata" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "idx_provenance_reddit_id" ON "provenance_metadata" USING btree ("target_reddit_id");--> statement-breakpoint
CREATE INDEX "idx_subreddits_name" ON "subreddits" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_users_username" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "idx_users_sync_status" ON "users" USING btree ("sync_status");