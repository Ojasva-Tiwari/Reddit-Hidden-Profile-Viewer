import {
  normalizeContentStatus,
  normalizeMediaReferences,
  normalizePost,
  normalizeComment,
  extractProvenance,
} from "../src/lib/datasource/normalization";
import { TimelineService } from "../src/server/services/timeline.service";
import { ActivityService } from "../src/server/services/activity.service";
import { PostService } from "../src/server/services/post.service";
import { CommentService } from "../src/server/services/comment.service";
import { AISummaryService } from "../src/server/services/ai-summary.service";
import { GeminiClient } from "../src/lib/ai/gemini";
import { usernameParamSchema, postsQuerySchema } from "../src/server/schemas/api.schemas";
import { checkRateLimit } from "../src/server/middleware/rate-limiter";
import { IRedditDataSource } from "../src/lib/datasource/reddit-data-source";
import { RedditUser, RedditPost, RedditComment, PaginatedResult } from "../src/lib/datasource/types";

let passed = 0;
let failed = 0;

function assert(description: string, condition: boolean) {
  if (condition) {
    console.log(`  ✓ ${description}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${description}`);
    failed++;
  }
}

// Complete mock source fixture representing production variety
class MockProductionDataSource implements IRedditDataSource {
  readonly providerName = "MockProductionDataSource";

  async getUserProfile(username: string): Promise<RedditUser | null> {
    return {
      username,
      totalKarma: 1500,
      linkKarma: 900,
      commentKarma: 600,
      isSuspended: false,
      isDeleted: false,
      createdUtc: new Date("2015-05-15T00:00:00Z"),
    };
  }

  async getPosts(options: any): Promise<PaginatedResult<RedditPost>> {
    const posts: RedditPost[] = [
      {
        redditId: "t3_post1",
        authorUsername: "target_user",
        subredditName: "technology",
        title: "First Post Title",
        selftext: "Body text of first post",
        permalink: "/r/technology/comments/post1",
        score: 500,
        numComments: 35,
        createdUtc: new Date("2023-01-01T12:00:00Z"),
        status: "VISIBLE",
        mediaStatus: "MEDIA_AVAILABLE",
        isNsfw: false,
        isSpoiler: false,
        isLocked: false,
      },
      {
        redditId: "t3_post2",
        authorUsername: "target_user",
        subredditName: "science",
        title: "Deleted Post Title",
        selftext: "Preserved original text before author deletion",
        permalink: "/r/science/comments/post2",
        score: 120,
        numComments: 4,
        createdUtc: new Date("2023-01-01T12:00:00Z"), // Identical timestamp
        status: "DELETED_LATER",
        mediaStatus: "MEDIA_UNAVAILABLE",
        isNsfw: false,
        isSpoiler: false,
        isLocked: false,
      },
      {
        redditId: "t3_post3",
        authorUsername: "target_user",
        subredditName: "news",
        title: "Removed Post Title",
        selftext: "[removed]",
        permalink: "/r/news/comments/post3",
        score: 10,
        numComments: 1,
        createdUtc: new Date("2022-06-15T09:00:00Z"),
        status: "REMOVED",
        mediaStatus: "MEDIA_REFERENCE_ONLY",
        isNsfw: false,
        isSpoiler: false,
        isLocked: false,
      },
    ];

    let filtered = posts;
    if (options.status && options.status !== "ALL") {
      filtered = filtered.filter((p) => p.status === options.status);
    }
    if (options.subreddit) {
      filtered = filtered.filter((p) => p.subredditName.toLowerCase() === options.subreddit.toLowerCase());
    }
    if (options.sort === "oldest") {
      filtered = [...filtered].reverse();
    }

    return { data: filtered, totalFetched: filtered.length, hasMore: false };
  }

  async getComments(options: any): Promise<PaginatedResult<RedditComment>> {
    const comments: RedditComment[] = [
      {
        redditId: "t1_com1",
        postRedditId: "t3_post1",
        parentId: "t3_post1",
        authorUsername: "target_user",
        subredditName: "technology",
        body: "I prefer TypeScript and Rust for resilient distributed architectures.",
        score: 45,
        createdUtc: new Date("2023-01-02T10:00:00Z"),
        status: "EDITED",
        isDistinguished: null,
        isNsfw: false,
      },
      {
        redditId: "t1_com2",
        postRedditId: "t3_post2",
        parentId: "t3_post2",
        authorUsername: "target_user",
        subredditName: "science",
        body: "[deleted]",
        score: 2,
        createdUtc: new Date("2021-05-10T08:00:00Z"),
        status: "DELETED",
        isDistinguished: null,
        isNsfw: false,
      },
    ];

    let filtered = comments;
    if (options.status && options.status !== "ALL") {
      filtered = filtered.filter((c) => c.status === options.status);
    }
    if (options.subreddit) {
      filtered = filtered.filter((c) => c.subredditName.toLowerCase() === options.subreddit.toLowerCase());
    }

    return { data: filtered, totalFetched: filtered.length, hasMore: false };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

class MockGemini extends GeminiClient {
  override isConfigured(): boolean {
    return true;
  }
  override async generateProfileSummary() {
    return {
      success: true,
      data: {
        username: "target_user",
        totalInsights: 2,
        generatedAt: new Date().toISOString(),
        modelVersion: "gemini-2.5-flash",
        schemaVersion: "1",
        insights: [
          {
            id: "ins-1",
            number: 1,
            category: "INTERESTS" as const,
            title: "Distributed Systems Engineering",
            finding: "Frequently participates in software architecture and systems engineering topics.",
            classification: "EXPLICIT" as const,
            confidence: "HIGH" as const,
            evidenceIds: ["t1_com1"],
          },
          {
            id: "ins-2",
            number: 2,
            category: "COMMUNITIES" as const,
            title: "Active Technology Discussion",
            finding: "Consistently engages in r/technology.",
            classification: "STRONGLY_SUPPORTED" as const,
            confidence: "HIGH" as const,
            evidenceIds: ["t3_post1"],
          },
        ],
      },
    };
  }
}

async function runMilestone7Tests() {
  console.log("=== RUNNING MILESTONE 7 END-TO-END ACCEPTANCE SUITE ===\n");

  const mockSource = new MockProductionDataSource();
  const postService = new PostService(mockSource);
  const commentService = new CommentService(mockSource);
  const timelineService = new TimelineService(mockSource);
  const activityService = new ActivityService(mockSource);
  const aiService = new AISummaryService(new MockGemini(), postService, commentService);

  // 1. Search & Input Sanitization
  console.log("Suite 1: Search & Username Normalization");
  assert("Trims leading 'u/' correctly", usernameParamSchema.parse("u/target_user") === "target_user");
  assert("Trims leading 'U/' correctly", usernameParamSchema.parse("U/target_user") === "target_user");
  assert("Rejects invalid characters", !usernameParamSchema.safeParse("user@name!").success);
  assert("Rejects empty username", !usernameParamSchema.safeParse("").success);

  // 2. Posts & Comments Query Validation
  console.log("\nSuite 2: Query Validation & Parameter Coercion");
  const parsedQuery = postsQuerySchema.parse({ limit: "25", sort: "oldest", status: "DELETED_LATER" });
  assert("Coerces limit to integer number", typeof parsedQuery.limit === "number" && parsedQuery.limit === 25);
  assert("Preserves sort enum value", parsedQuery.sort === "oldest");
  assert("Preserves status enum value", parsedQuery.status === "DELETED_LATER");

  // 3. Historical Status Preservation
  console.log("\nSuite 3: Canonical Status Normalization Across Formats");
  assert("Preserves VISIBLE", normalizeContentStatus({ selftext: "Valid content" }) === "VISIBLE");
  assert("Preserves DELETED", normalizeContentStatus({ selftext: "[deleted]" }) === "DELETED");
  assert("Preserves REMOVED", normalizeContentStatus({ body: "[removed]" }) === "REMOVED");
  assert("Preserves EDITED", normalizeContentStatus({ selftext: "abc", edited: 1672534800 }) === "EDITED");
  assert("Preserves DELETED_LATER", normalizeContentStatus({ selftext: "Preserved text", _meta: { is_deleted: true } }) === "DELETED_LATER");
  assert("Preserves INITIALLY_UNAVAILABLE", normalizeContentStatus({ selftext: undefined, title: undefined }) === "INITIALLY_UNAVAILABLE");

  // 4. Media Classification
  console.log("\nSuite 4: Media Classification & Archive State");
  const mediaAvailable = normalizeMediaReferences({
    id: "p1",
    author: "user",
    subreddit: "pics",
    title: "Photo",
    created_utc: 1672531200,
    permalink: "/r/pics/p1",
    preview: { images: [{ source: { url: "https://preview.redd.it/photo.jpg" }, resolutions: [] }] },
  });
  assert("Classifies preview image to MEDIA_AVAILABLE", mediaAvailable.mediaStatus === "MEDIA_AVAILABLE");

  const mediaRefOnly = normalizeMediaReferences({
    id: "p2",
    author: "user",
    subreddit: "gifs",
    title: "Gif",
    created_utc: 1672531200,
    permalink: "/r/gifs/p2",
    url: "https://i.imgur.com/example.gif",
  });
  assert("Classifies external URL without preview bytes to MEDIA_REFERENCE_ONLY", mediaRefOnly.mediaStatus === "MEDIA_REFERENCE_ONLY");

  // 5. Timeline Merging & Deterministic Tie-Breaking
  console.log("\nSuite 5: Timeline Merging & Deterministic Ordering");
  const timeline = await timelineService.getTimeline("target_user", { sort: "newest" });
  assert("Timeline contains merged posts and comments (5 items)", timeline.length === 5);
  const sameTime = timeline.filter((t) => t.dateStr === "2023-01-01");
  assert("Tie-breaking handles same-timestamp records gracefully", sameTime.length === 2);
  assert("Deterministic tie-breaker uses alphanumeric ID order", sameTime[0].redditId.localeCompare(sameTime[1].redditId) > 0);

  // 6. Activity Metrics Calculation
  console.log("\nSuite 6: Activity Statistics & UTC Timezone Consistency");
  const activity = await activityService.getActivityDistribution("target_user");
  assert("Top subreddits calculated", activity.topSubreddits.length > 0);
  assert("Subreddit percentages are non-negative and <= 100", activity.topSubreddits.every((s) => s.percentage >= 0 && s.percentage <= 100));
  assert("Hourly activity array has 24 bins", activity.hourlyActivityUtc.length === 24);
  assert("Daily activity array has 7 days", activity.dailyActivity.length === 7);
  assert("Activity by year includes active years", activity.yearlyActivity.some((y) => y.year === 2023));

  // 7. Provenance Derivation
  console.log("\nSuite 7: Provenance Extraction & Snapshots");
  const postNorm = normalizePost({
    id: "prov_post",
    author: "target_user",
    subreddit: "test",
    title: "Title",
    selftext: "Body",
    created_utc: 1672531200,
    edited: 1672534800,
    permalink: "/r/test/prov_post",
    _meta: { is_edited: true },
  });
  const prov = extractProvenance(postNorm);
  assert("Provenance derives version 2 for edited post", prov !== null && prov.versionNumber === 2);

  // 8. Rate Limiting Sliding Window
  console.log("\nSuite 8: Rate Limiting Sliding Window & Enforcement");
  const clientKey = "test_client_1";
  assert("Initial request passes within limit", checkRateLimit(clientKey, 2).success);
  assert("Second request passes within limit", checkRateLimit(clientKey, 2).success);
  assert("Third request triggers 429 rate limit", !checkRateLimit(clientKey, 2).success);

  // 9. AI Summary & Evidence Grounding Verification
  console.log("\nSuite 9: AI Summary Synthesis & Evidence Verification");
  const summaryRes = await aiService.getSummary("target_user", true);
  assert("Summary generation succeeds", summaryRes.success && summaryRes.data !== undefined);
  assert("All insights contain valid citations", summaryRes.data?.insights.every((i) => i.evidenceIds.length > 0) === true);
  assert("Model version is recorded", summaryRes.data?.modelVersion === "gemini-2.5-flash");

  console.log(`\n========================================`);
  console.log(`TOTAL ACCEPTANCE TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runMilestone7Tests();
