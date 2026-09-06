import { GeminiClient } from "../src/lib/ai/gemini";
import { AISummaryService } from "../src/server/services/ai-summary.service";
import { PostService } from "../src/server/services/post.service";
import { CommentService } from "../src/server/services/comment.service";
import { IRedditDataSource } from "../src/lib/datasource/reddit-data-source";
import { RedditUser, RedditPost, RedditComment, PaginatedResult } from "../src/lib/datasource/types";
import { checkRateLimit } from "../src/server/middleware/rate-limiter";

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

class MockDataSource implements IRedditDataSource {
  readonly providerName = "MockDataSource";

  async getUserProfile(username: string): Promise<RedditUser | null> {
    return { username, totalKarma: 200, linkKarma: 100, commentKarma: 100, isSuspended: false, isDeleted: false };
  }

  async getPosts(): Promise<PaginatedResult<RedditPost>> {
    return {
      data: [
        {
          redditId: "t3_post1",
          authorUsername: "alice",
          subredditName: "typescript",
          title: "Building scalable distributed apps",
          selftext: "I write TypeScript and Rust microservices daily.",
          permalink: "/r/typescript/post1",
          score: 150,
          numComments: 20,
          createdUtc: new Date("2023-01-01T12:00:00Z"),
          status: "VISIBLE",
          mediaStatus: "MEDIA_UNAVAILABLE",
          isNsfw: false,
          isSpoiler: false,
          isLocked: false,
        },
        {
          redditId: "t3_post2",
          authorUsername: "alice",
          subredditName: "cooking",
          title: "Baking sourdough at high altitude",
          selftext: "Tips for hydration ratios when baking above 5000ft.",
          permalink: "/r/cooking/post2",
          score: 85,
          numComments: 14,
          createdUtc: new Date("2023-02-01T12:00:00Z"),
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
          authorUsername: "alice",
          subredditName: "typescript",
          body: "We migrated all our backend services to strict TypeScript types.",
          score: 30,
          createdUtc: new Date("2023-01-02T10:00:00Z"),
          status: "VISIBLE",
          isDistinguished: null,
          isNsfw: false,
        },
        {
          redditId: "t1_com2",
          postRedditId: "t3_post2",
          parentId: "t3_post2",
          authorUsername: "alice",
          subredditName: "coffee",
          body: "Pour-over using a V60 gives the cleanest extraction.",
          score: 25,
          createdUtc: new Date("2023-02-15T08:00:00Z"),
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

class ControllableMockGemini extends GeminiClient {
  public callCount = 0;
  public configured = true;
  public delayMs = 0;
  public mockResponse: any = null;

  override isConfigured(): boolean {
    return this.configured;
  }

  override getModelName(): string {
    return "gemini-2.5-flash-lite";
  }

  override async generateProfileSummary(): Promise<any> {
    this.callCount++;
    if (this.delayMs > 0) {
      await new Promise((r) => setTimeout(r, this.delayMs));
    }
    if (this.mockResponse) {
      return this.mockResponse;
    }
    return {
      success: true,
      data: {
        username: "alice",
        totalInsights: 2,
        generatedAt: new Date().toISOString(),
        modelVersion: "gemini-2.5-flash-lite",
        schemaVersion: "1",
        insights: [
          {
            id: "ins-1",
            number: 1,
            category: "INTERESTS",
            title: "TypeScript Backend Specialist",
            finding: "Regularly designs and maintains strict TypeScript systems.",
            classification: "EXPLICIT",
            confidence: "HIGH",
            evidenceIds: ["t3_post1", "t1_com1"],
          },
          {
            id: "ins-2",
            number: 2,
            category: "HOBBIES",
            title: "Artisanal Baking & Coffee",
            finding: "Enjoys baking sourdough and pour-over coffee extraction.",
            classification: "STRONGLY_SUPPORTED",
            confidence: "HIGH",
            evidenceIds: ["t3_post2", "t1_com2"],
          },
        ],
      },
    };
  }
}

async function runGeminiIntegrationTests() {
  console.log("=== RUNNING GEMINI AI INTEGRATION & RESILIENCE TESTS ===\n");

  const originalKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL;

  try {
    // 1. Dynamic Environment Variable Loading
    console.log("Suite 1: Dynamic Environment Variable Hydration");
    delete process.env.GEMINI_API_KEY;
    const dynamicClient = new GeminiClient();
    assert("Client correctly unconfigured when GEMINI_API_KEY is missing", !dynamicClient.isConfigured());

    process.env.GEMINI_API_KEY = "test-mock-key-123";
    assert("Client dynamically discovers newly set GEMINI_API_KEY without restart", dynamicClient.isConfigured());
    assert("Default model is gemini-3.5-flash-lite", dynamicClient.getModelName() === "gemini-3.5-flash-lite");

    process.env.GEMINI_MODEL = "custom-model-test";
    assert("Client dynamically reflects updated GEMINI_MODEL", dynamicClient.getModelName() === "custom-model-test");

    delete process.env.GEMINI_MODEL;

    // 2. Missing Key Error Handling & Secret Sanitization
    console.log("\nSuite 2: Missing Key Error Handling & Clean Contract");
    delete process.env.GEMINI_API_KEY;
    const unconfiguredClient = new GeminiClient();
    const mockSource = new MockDataSource();
    const postService = new PostService(mockSource);
    const commentService = new CommentService(mockSource);
    const unconfiguredService = new AISummaryService(unconfiguredClient, postService, commentService);

    const missingKeyRes = await unconfiguredService.getSummary("alice", true);
    assert("Returns success: false when API key is missing", !missingKeyRes.success);
    assert("Returns AI_UNAVAILABLE code", missingKeyRes.code === "AI_UNAVAILABLE");
    assert("Error message is clean and user-friendly", missingKeyRes.error === "GEMINI_API_KEY is not configured on the server.");
    assert("Does not expose raw stack trace or secrets", !JSON.stringify(missingKeyRes).includes("process.env"));

    // 3. Deterministic In-Memory Caching
    console.log("\nSuite 3: Deterministic In-Memory Caching");
    const mockGemini = new ControllableMockGemini();
    const cachedService = new AISummaryService(mockGemini, postService, commentService);

    mockGemini.callCount = 0;
    const firstCall = await cachedService.getSummary("alice", false);
    assert("First call generates successfully", firstCall.success && firstCall.data !== undefined);
    assert("First call invoked Gemini client", mockGemini.callCount === 1);
    assert("First call source is GEMINI_GENERATION", firstCall.sourceOrigin === "GEMINI_GENERATION");

    const secondCall = await cachedService.getSummary("alice", false);
    assert("Second call returns cached summary", secondCall.success && secondCall.data !== undefined);
    assert("Second call DID NOT invoke Gemini client (cache hit)", mockGemini.callCount === 1);
    assert("Second call source is DATABASE_CACHE (cached)", secondCall.sourceOrigin === "DATABASE_CACHE");
    assert("Cached data matches first call insights", secondCall.data?.insights.length === firstCall.data?.insights.length);

    // 4. Force Refresh Cache Bypass
    console.log("\nSuite 4: Force Refresh Cache Invalidation");
    const refreshCall = await cachedService.getSummary("alice", true);
    assert("Refresh call succeeds", refreshCall.success && refreshCall.data !== undefined);
    assert("Refresh call re-invokes Gemini client", mockGemini.callCount === 2);
    assert("Refresh call returns fresh GEMINI_GENERATION source", refreshCall.sourceOrigin === "GEMINI_GENERATION");

    // 5. In-Flight Request Deduplication (Stampede Protection)
    console.log("\nSuite 5: In-Flight Request Deduplication (Stampede Prevention)");
    mockGemini.callCount = 0;
    mockGemini.delayMs = 50; // Add 50ms delay to simulate network latency

    // Fire 3 simultaneous requests for a new user
    const [resA, resB, resC] = await Promise.all([
      cachedService.getSummary("alice", true),
      cachedService.getSummary("alice", false),
      cachedService.getSummary("alice", false),
    ]);

    assert("All concurrent requests resolved successfully", resA.success && resB.success && resC.success);
    assert("Only 1 Gemini generation was executed across 3 concurrent requests", mockGemini.callCount === 1);

    // 6. Sliding Window Rate Limiting Enforcement
    console.log("\nSuite 6: Sliding Window Rate Limiting Enforcement");
    const testIp = "192.168.1.100";
    const r1 = checkRateLimit(`ai_test_${testIp}`, 3);
    const r2 = checkRateLimit(`ai_test_${testIp}`, 3);
    const r3 = checkRateLimit(`ai_test_${testIp}`, 3);
    const r4 = checkRateLimit(`ai_test_${testIp}`, 3);

    assert("Request 1 passes under limit", r1.success);
    assert("Request 2 passes under limit", r2.success);
    assert("Request 3 passes under limit", r3.success);
    assert("Request 4 is blocked by rate limiter", !r4.success);
    assert("Returns resetMs > 0", r4.resetMs > 0);

    // 7. Structured Output Grounding Verification
    console.log("\nSuite 7: Grounding Verification & Citation Integrity");
    assert("Every generated insight has at least 1 citation", firstCall.data?.insights.every((i) => i.evidenceIds.length > 0) === true);
    assert("Insights have correct classification enum", firstCall.data?.insights.every((i) => ["EXPLICIT", "STRONGLY_SUPPORTED", "WEAK_INFERENCE"].includes(i.classification)) === true);
    assert("Insights have correct confidence enum", firstCall.data?.insights.every((i) => ["HIGH", "MEDIUM", "SPECULATIVE"].includes(i.confidence)) === true);

    console.log("\n========================================");
    console.log(`TOTAL GEMINI INTEGRATION TESTS: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log("========================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    // Restore original env vars
    if (originalKey !== undefined) {
      process.env.GEMINI_API_KEY = originalKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
    if (originalModel !== undefined) {
      process.env.GEMINI_MODEL = originalModel;
    } else {
      delete process.env.GEMINI_MODEL;
    }
  }
}

runGeminiIntegrationTests().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
