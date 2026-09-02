import { ProfileSummaryOutputSchema, InsightItemSchema } from "../src/lib/ai/schemas";
import { extractDeterministicSignals, prepareEvidenceSelection } from "../src/lib/ai/evidence";
import { AISummaryService } from "../src/server/services/ai-summary.service";
import { GeminiClient, GeminiGenerationResult } from "../src/lib/ai/gemini";
import { PostService } from "../src/server/services/post.service";
import { CommentService } from "../src/server/services/comment.service";
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

// Mock Data Source
class MockRedditDataSource implements IRedditDataSource {
  readonly providerName = "MockRedditDataSource";

  async getUserProfile(username: string): Promise<RedditUser | null> {
    return { username, totalKarma: 100, linkKarma: 50, commentKarma: 50, isSuspended: false, isDeleted: false };
  }

  async getPosts(): Promise<PaginatedResult<RedditPost>> {
    return {
      data: [
        {
          redditId: "t3_post1",
          authorUsername: "bob",
          subredditName: "technology",
          title: "I am an open source maintainer working on distributed systems",
          selftext: "I write Go and TypeScript daily and maintain several database libraries.",
          permalink: "/r/technology/post1",
          score: 250,
          numComments: 40,
          createdUtc: new Date("2023-01-01T12:00:00Z"),
          status: "VISIBLE",
          mediaStatus: "MEDIA_UNAVAILABLE",
          isNsfw: false,
          isSpoiler: false,
          isLocked: false,
        },
        {
          redditId: "t3_post2",
          authorUsername: "bob",
          subredditName: "chess",
          title: "Reached 1800 Elo rating on chess.com",
          selftext: "Playing blitz games during my commute.",
          permalink: "/r/chess/post2",
          score: 80,
          numComments: 12,
          createdUtc: new Date("2023-03-01T12:00:00Z"),
          status: "VISIBLE",
          mediaStatus: "MEDIA_UNAVAILABLE",
          isNsfw: false,
          isSpoiler: false,
          isLocked: false,
        },
      ],
      totalFetched: 2,
      hasMore: false,
    };
  }

  async getComments(): Promise<PaginatedResult<RedditComment>> {
    return {
      data: [
        {
          redditId: "t1_com1",
          postRedditId: "t3_post1",
          parentId: "t3_post1",
          authorUsername: "bob",
          subredditName: "technology",
          body: "I explicitly prefer PostgreSQL over MySQL for high-concurrency systems.",
          score: 45,
          createdUtc: new Date("2023-01-02T10:00:00Z"),
          status: "VISIBLE",
          isDistinguished: null,
          isNsfw: false,
        },
        {
          redditId: "t1_com2",
          postRedditId: "t3_post2",
          parentId: "t3_post2",
          authorUsername: "bob",
          subredditName: "coffee",
          body: "AeroPress is my favorite travel brewing equipment.",
          score: 20,
          createdUtc: new Date("2023-04-10T08:00:00Z"),
          status: "VISIBLE",
          isDistinguished: null,
          isNsfw: false,
        },
      ],
      totalFetched: 2,
      hasMore: false,
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

// Mock Gemini Client
class MockGeminiClient extends GeminiClient {
  public mockResponse: GeminiGenerationResult = { success: true };

  override isConfigured(): boolean {
    return true;
  }

  override async generateProfileSummary(): Promise<GeminiGenerationResult> {
    return this.mockResponse;
  }
}

async function runMilestone6Tests() {
  console.log("=== RUNNING MILESTONE 6 TEST SUITE (AI Summary & Evidence Grounding) ===\n");

  // 1. AI Schema Validation
  console.log("Suite 1: AI Schema Validation");
  const validInsight = {
    id: "insight-1",
    number: 1,
    category: "HOBBIES",
    title: "Chess Enthusiast",
    finding: "Frequently plays competitive blitz games.",
    classification: "STRONGLY_SUPPORTED",
    confidence: "HIGH",
    evidenceIds: ["t3_post2"],
  };
  const insightValidation = InsightItemSchema.safeParse(validInsight);
  assert("Valid insight parses correctly", insightValidation.success);

  const invalidInsight = { ...validInsight, category: "INVALID_CAT" };
  assert("Rejects invalid category", !InsightItemSchema.safeParse(invalidInsight).success);

  // 2. Exact 30-Item Handling
  console.log("\nSuite 2: 30-Item Bounds Handling");
  const full30Insights = Array.from({ length: 30 }, (_, i) => ({
    ...validInsight,
    id: `insight-${i + 1}`,
    number: i + 1,
  }));
  const full30Summary = {
    username: "bob",
    totalInsights: 30,
    generatedAt: new Date().toISOString(),
    modelVersion: "gemini-2.0-flash",
    schemaVersion: "1",
    insights: full30Insights,
  };
  assert("30 insights structure is valid", ProfileSummaryOutputSchema.safeParse(full30Summary).success);

  // 3. Fewer than 30 handling (No filler requirement)
  console.log("\nSuite 3: Fewer-Than-30 (No Filler) Handling");
  const fewerSummary = {
    ...full30Summary,
    totalInsights: 5,
    insights: full30Insights.slice(0, 5),
  };
  assert("Fewer than 30 insights is valid without padding", ProfileSummaryOutputSchema.safeParse(fewerSummary).success);

  // 4. Deterministic Signals & Evidence Extraction
  console.log("\nSuite 4: Deterministic Signal Extraction");
  const mockSource = new MockRedditDataSource();
  const postService = new PostService(mockSource);
  const commentService = new CommentService(mockSource);

  const postsRes = await postService.queryPosts("bob");
  const commentsRes = await commentService.queryComments("bob");
  const signals = extractDeterministicSignals(postsRes.posts, commentsRes.comments);

  assert("Extracts total count accurately (4 items)", signals.totalAnalyzed === 4);
  assert("Identifies top subreddits", signals.topSubreddits.some((s) => s.name === "technology"));
  assert("Calculates posts/comments ratio", signals.postsCommentsRatio === 1);

  // 5. Evidence Selection & Compaction
  console.log("\nSuite 5: Compact Evidence Selection");
  const evidenceSelection = prepareEvidenceSelection(postsRes.posts, commentsRes.comments);
  assert("Compacts records with valid structure", evidenceSelection.length === 4);
  assert("Includes redditId and status", evidenceSelection[0].id.startsWith("t3_") && evidenceSelection[0].status === "VISIBLE");

  // 6. Invalid Evidence ID Rejection
  console.log("\nSuite 6: Grounding Audit & Hallucinated ID Rejection");
  const mockGemini = new MockGeminiClient();
  mockGemini.mockResponse = {
    success: true,
    data: {
      username: "bob",
      totalInsights: 2,
      generatedAt: new Date().toISOString(),
      modelVersion: "gemini-2.0-flash",
      schemaVersion: "1",
      insights: [
        {
          id: "ins-1",
          number: 1,
          category: "INTERESTS",
          title: "Valid Open Source Work",
          finding: "Maintains Go and TypeScript distributed systems.",
          classification: "EXPLICIT",
          confidence: "HIGH",
          evidenceIds: ["t3_post1"], // Valid ID
        },
        {
          id: "ins-2",
          number: 2,
          category: "FOOD",
          title: "Hallucinated Pizza Interest",
          finding: "Claims user eats pizza daily.",
          classification: "WEAK_INFERENCE",
          confidence: "SPECULATIVE",
          evidenceIds: ["t3_hallucinated_id_999"], // Hallucinated ID
        },
      ],
    },
  };

  const aiService = new AISummaryService(mockGemini, postService, commentService);
  const summaryResult = await aiService.getSummary("bob", true);

  assert("Summary generation succeeded", summaryResult.success && summaryResult.data !== undefined);
  assert("Retains valid insight with authentic evidence ID", summaryResult.data?.insights.some((i) => i.title === "Valid Open Source Work") === true);
  assert("Drops ungrounded insight with hallucinated evidence ID", summaryResult.data?.insights.some((i) => i.title === "Hallucinated Pizza Interest") === false);
  assert("Re-indexes retained insights starting at #1", summaryResult.data?.insights[0].number === 1);

  // 7. Duplicate Insight Rejection
  console.log("\nSuite 7: Duplicate Insight Rejection");
  mockGemini.mockResponse = {
    success: true,
    data: {
      username: "bob",
      totalInsights: 2,
      generatedAt: new Date().toISOString(),
      modelVersion: "gemini-2.0-flash",
      schemaVersion: "1",
      insights: [
        {
          id: "ins-1",
          number: 1,
          category: "INTERESTS",
          title: "Duplicate Title",
          finding: "Finding 1",
          classification: "EXPLICIT",
          confidence: "HIGH",
          evidenceIds: ["t3_post1"],
        },
        {
          id: "ins-2",
          number: 2,
          category: "INTERESTS",
          title: "Duplicate Title",
          finding: "Finding 2",
          classification: "STRONGLY_SUPPORTED",
          confidence: "MEDIUM",
          evidenceIds: ["t1_com1"],
        },
      ],
    },
  };

  const dedupResult = await aiService.getSummary("bob", true);
  assert("Deduplicates identical insight titles", dedupResult.data?.insights.length === 1);

  // 8. Insufficient Data Handling (<3 records)
  console.log("\nSuite 8: Insufficient Archival Data Handling");
  class EmptySource implements IRedditDataSource {
    readonly providerName = "EmptySource";
    async getUserProfile(username: string): Promise<RedditUser | null> {
      return { username, totalKarma: 0, linkKarma: 0, commentKarma: 0, isSuspended: false, isDeleted: false };
    }
    async getPosts(): Promise<PaginatedResult<RedditPost>> {
      return { data: [], totalFetched: 0, hasMore: false };
    }
    async getComments(): Promise<PaginatedResult<RedditComment>> {
      return { data: [], totalFetched: 0, hasMore: false };
    }
    async healthCheck(): Promise<boolean> {
      return true;
    }
  }

  const emptyPostService = new PostService(new EmptySource());
  const emptyCommentService = new CommentService(new EmptySource());
  const emptyAIService = new AISummaryService(mockGemini, emptyPostService, emptyCommentService);
  const emptyResult = await emptyAIService.getSummary("ghost_user", true);

  assert("Returns INSUFFICIENT_DATA when records < 3", emptyResult.success === false && emptyResult.code === "INSUFFICIENT_DATA");

  // 9. Gemini Unavailable Handling
  console.log("\nSuite 9: Gemini Service Unavailable Handling");
  class UnconfiguredGemini extends GeminiClient {
    override isConfigured(): boolean {
      return false;
    }
  }
  const unconfiguredAIService = new AISummaryService(new UnconfiguredGemini(), postService, commentService);
  const unavailResult = await unconfiguredAIService.getSummary("bob", true);
  assert("Gracefully returns AI_UNAVAILABLE when API key is missing", unavailResult.success === false && unavailResult.code === "AI_UNAVAILABLE");

  console.log(`\n========================================`);
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runMilestone6Tests();
