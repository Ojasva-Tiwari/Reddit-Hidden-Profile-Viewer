import { PostService } from "../src/server/services/post.service";
import { CommentService } from "../src/server/services/comment.service";
import { IRedditDataSource } from "../src/lib/datasource/reddit-data-source";
import { RedditUser, RedditPost, RedditComment, PaginatedResult } from "../src/lib/datasource/types";
import { postsQuerySchema, commentsQuerySchema } from "../src/server/schemas/api.schemas";

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

// Mock large archive data source simulating 10,000+ items
class MockLargeArchiveDataSource implements IRedditDataSource {
  readonly providerName = "MockLargeArchiveDataSource";
  private allPosts: RedditPost[] = [];
  private allComments: RedditComment[] = [];
  public requestLog: { endpoint: string; options: any }[] = [];

  async healthCheck(): Promise<boolean> {
    return true;
  }

  constructor(postCount = 10000, commentCount = 5000) {
    const baseTime = 1700000000; // Epoch seconds

    for (let i = 0; i < postCount; i++) {
      const createdSeconds = baseTime - i * 3600; // Decreasing by 1 hour per item
      this.allPosts.push({
        redditId: `t3_post_${i}`,
        authorUsername: "power_user",
        subredditName: i % 2 === 0 ? "technology" : "science",
        title: `Post number ${i} about topic ${i % 10}`,
        selftext: `Archived content body for post ${i}`,
        permalink: `/r/technology/comments/post_${i}`,
        score: (i * 7) % 500,
        numComments: (i * 3) % 50,
        createdUtc: new Date(createdSeconds * 1000),
        status: i % 15 === 0 ? "DELETED" : i % 20 === 0 ? "REMOVED" : i % 7 === 0 ? "EDITED" : "VISIBLE",
        mediaStatus: i % 4 === 0 ? "MEDIA_AVAILABLE" : "MEDIA_UNAVAILABLE",
        isNsfw: i % 13 === 0,
        isSpoiler: false,
        isLocked: false,
        rawPayload: {
          created_utc: createdSeconds,
          id: `post_${i}`,
        },
      });
    }

    for (let j = 0; j < commentCount; j++) {
      const createdSeconds = baseTime - j * 1800;
      this.allComments.push({
        redditId: `t1_comm_${j}`,
        authorUsername: "power_user",
        postRedditId: `t3_post_${Math.floor(j / 3)}`,
        parentId: `t3_post_${Math.floor(j / 3)}`,
        subredditName: j % 2 === 0 ? "programming" : "webdev",
        body: `Comment reply text for comment ${j}`,
        permalink: `/r/programming/comments/post_${Math.floor(j / 3)}/comment/${j}`,
        score: (j * 5) % 250,
        createdUtc: new Date(createdSeconds * 1000),
        status: j % 10 === 0 ? "DELETED" : "VISIBLE",
        isDistinguished: null,
        isNsfw: j % 17 === 0,
        rawPayload: {
          created_utc: createdSeconds,
          id: `comm_${j}`,
        },
      });
    }
  }

  async getUserProfile(username: string): Promise<RedditUser | null> {
    return {
      username,
      totalKarma: 50000,
      linkKarma: 35000,
      commentKarma: 15000,
      isSuspended: false,
      isDeleted: false,
      createdUtc: new Date("2016-01-01T00:00:00Z"),
    };
  }

  async getPosts(options: any): Promise<PaginatedResult<RedditPost>> {
    this.requestLog.push({ endpoint: "posts", options });
    const limit = Math.min(options.limit || 50, 100);
    const sort = options.sort || "desc";

    let dataset = [...this.allPosts];

    if (options.subreddit) {
      dataset = dataset.filter((p) => p.subredditName.toLowerCase() === options.subreddit.toLowerCase());
    }

    if (sort === "desc") {
      dataset.sort((a, b) => b.createdUtc.getTime() - a.createdUtc.getTime());
      if (options.before !== undefined) {
        dataset = dataset.filter((p) => Math.floor(p.createdUtc.getTime() / 1000) < options.before);
      }
      if (options.after !== undefined) {
        dataset = dataset.filter((p) => Math.floor(p.createdUtc.getTime() / 1000) > options.after);
      }
    } else {
      dataset.sort((a, b) => a.createdUtc.getTime() - b.createdUtc.getTime());
      if (options.after !== undefined) {
        dataset = dataset.filter((p) => Math.floor(p.createdUtc.getTime() / 1000) > options.after);
      }
      if (options.before !== undefined) {
        dataset = dataset.filter((p) => Math.floor(p.createdUtc.getTime() / 1000) < options.before);
      }
    }

    const sliced = dataset.slice(0, limit);
    const lastTimestamp = sliced.length > 0 ? Math.floor(sliced[sliced.length - 1].createdUtc.getTime() / 1000) : undefined;
    const hasMore = dataset.length > limit;

    return {
      data: sliced,
      hasMore,
      nextBefore: sort === "desc" ? lastTimestamp : undefined,
      nextAfter: sort === "asc" ? lastTimestamp : undefined,
      nextCursor: lastTimestamp,
      totalFetched: sliced.length,
    };
  }

  async getComments(options: any): Promise<PaginatedResult<RedditComment>> {
    this.requestLog.push({ endpoint: "comments", options });
    const limit = Math.min(options.limit || 50, 100);
    const sort = options.sort || "desc";

    let dataset = [...this.allComments];

    if (options.subreddit) {
      dataset = dataset.filter((c) => c.subredditName.toLowerCase() === options.subreddit.toLowerCase());
    }

    if (sort === "desc") {
      dataset.sort((a, b) => b.createdUtc.getTime() - a.createdUtc.getTime());
      if (options.before !== undefined) {
        dataset = dataset.filter((c) => Math.floor(c.createdUtc.getTime() / 1000) < options.before);
      }
      if (options.after !== undefined) {
        dataset = dataset.filter((c) => Math.floor(c.createdUtc.getTime() / 1000) > options.after);
      }
    } else {
      dataset.sort((a, b) => a.createdUtc.getTime() - b.createdUtc.getTime());
      if (options.after !== undefined) {
        dataset = dataset.filter((c) => Math.floor(c.createdUtc.getTime() / 1000) > options.after);
      }
      if (options.before !== undefined) {
        dataset = dataset.filter((c) => Math.floor(c.createdUtc.getTime() / 1000) < options.before);
      }
    }

    const sliced = dataset.slice(0, limit);
    const lastTimestamp = sliced.length > 0 ? Math.floor(sliced[sliced.length - 1].createdUtc.getTime() / 1000) : undefined;
    const hasMore = dataset.length > limit;

    return {
      data: sliced,
      hasMore,
      nextBefore: sort === "desc" ? lastTimestamp : undefined,
      nextAfter: sort === "asc" ? lastTimestamp : undefined,
      nextCursor: lastTimestamp,
      totalFetched: sliced.length,
    };
  }
}

async function runInfiniteScrollTestSuite() {
  console.log("================================================================================");
  console.log("RUNNING SUITE: High-Scale Cursor Pagination & Infinite Scroll Architecture");
  console.log("================================================================================");

  const mockDataSource = new MockLargeArchiveDataSource(10000, 5000);
  const postService = new PostService(mockDataSource);
  const commentService = new CommentService(mockDataSource);

  // --------------------------------------------------------------------------
  console.log("\n[TEST GROUP 1: Sequential Cursor Advancement & Chunk Isolation]");
  // --------------------------------------------------------------------------
  const chunk1 = await postService.queryPosts("power_user", { limit: 50, sort: "newest" });
  assert("Chunk 1 returns 50 posts", chunk1.posts.length === 50);
  assert("Chunk 1 has nextCursor", chunk1.pagination.nextCursor !== undefined);
  assert("Chunk 1 hasMore is true", chunk1.pagination.hasMore === true);

  const chunk2 = await postService.queryPosts("power_user", {
    limit: 50,
    sort: "newest",
    cursor: chunk1.pagination.nextCursor,
  });
  assert("Chunk 2 returns 50 posts", chunk2.posts.length === 50);
  assert("Chunk 2 cursor advanced", chunk2.pagination.nextCursor !== chunk1.pagination.nextCursor);

  const chunk1Ids = new Set(chunk1.posts.map((p) => p.redditId));
  const chunk2Ids = new Set(chunk2.posts.map((p) => p.redditId));
  const hasChunk1And2Overlap = chunk2.posts.some((p) => chunk1Ids.has(p.redditId));
  assert("Chunk 1 and Chunk 2 contain completely disjoint IDs (no overlap)", !hasChunk1And2Overlap);

  const chunk3 = await postService.queryPosts("power_user", {
    limit: 50,
    sort: "newest",
    cursor: chunk2.pagination.nextCursor,
  });
  assert("Chunk 3 returns 50 posts", chunk3.posts.length === 50);
  const hasChunk2And3Overlap = chunk3.posts.some((p) => chunk2Ids.has(p.redditId));
  assert("Chunk 2 and Chunk 3 contain completely disjoint IDs", !hasChunk2And3Overlap);

  // --------------------------------------------------------------------------
  console.log("\n[TEST GROUP 2: Deep 15-Chunk Traversal (750+ items without repetition)]");
  // --------------------------------------------------------------------------
  const collectedPostIds = new Set<string>();
  let currentCursor: string | number | undefined = undefined;
  let chunkCount = 0;
  let totalDupsDetected = 0;

  for (let i = 0; i < 15; i++) {
    const res = await postService.queryPosts("power_user", {
      limit: 50,
      sort: "newest",
      cursor: currentCursor,
    });

    chunkCount++;
    for (const post of res.posts) {
      if (collectedPostIds.has(post.redditId)) {
        totalDupsDetected++;
      }
      collectedPostIds.add(post.redditId);
    }

    if (!res.pagination.hasMore || res.pagination.nextCursor === undefined) {
      break;
    }
    currentCursor = res.pagination.nextCursor;
  }

  assert("Successfully traversed 15 consecutive chunks", chunkCount === 15);
  assert("Collected exactly 750 unique posts across 15 chunks", collectedPostIds.size === 750);
  assert("Zero duplicate IDs encountered across 15 chunks", totalDupsDetected === 0);

  // --------------------------------------------------------------------------
  console.log("\n[TEST GROUP 3: Oldest First (Ascending) Traversal]");
  // --------------------------------------------------------------------------
  const ascChunk1 = await postService.queryPosts("power_user", { limit: 50, sort: "oldest" });
  assert("Ascending chunk 1 returns 50 posts", ascChunk1.posts.length === 50);
  assert("Ascending chunk 1 has nextCursor", ascChunk1.pagination.nextCursor !== undefined);

  const firstDate = new Date(ascChunk1.posts[0].createdUtc).getTime();
  const lastDate = new Date(ascChunk1.posts[ascChunk1.posts.length - 1].createdUtc).getTime();
  assert("Ascending chunk is sorted chronologically oldest to newest", firstDate <= lastDate);

  const ascChunk2 = await postService.queryPosts("power_user", {
    limit: 50,
    sort: "oldest",
    cursor: ascChunk1.pagination.nextCursor,
  });
  assert("Ascending chunk 2 returns 50 posts", ascChunk2.posts.length === 50);
  const ascChunk2FirstDate = new Date(ascChunk2.posts[0].createdUtc).getTime();
  assert("Ascending chunk 2 starts after chunk 1 last timestamp", ascChunk2FirstDate > lastDate);

  // --------------------------------------------------------------------------
  console.log("\n[TEST GROUP 4: Comments Pagination & State Separation]");
  // --------------------------------------------------------------------------
  const commChunk1 = await commentService.queryComments("power_user", { limit: 50, sort: "newest" });
  assert("Comments chunk 1 returns 50 items", commChunk1.comments.length === 50);
  assert("Comments chunk 1 has distinct nextCursor", commChunk1.pagination.nextCursor !== undefined);

  const commChunk2 = await commentService.queryComments("power_user", {
    limit: 50,
    sort: "newest",
    cursor: commChunk1.pagination.nextCursor,
  });
  const comm1Ids = new Set(commChunk1.comments.map((c) => c.redditId));
  const hasCommOverlap = commChunk2.comments.some((c) => comm1Ids.has(c.redditId));
  assert("Comment chunks 1 & 2 have no overlapping IDs", !hasCommOverlap);

  // --------------------------------------------------------------------------
  console.log("\n[TEST GROUP 5: Filter Invalidation & Schema Validation]");
  // --------------------------------------------------------------------------
  const validPostsQuery = postsQuerySchema.safeParse({
    limit: "50",
    cursor: "1699990000",
    sort: "newest",
    status: "VISIBLE",
    hasMedia: "true",
  });
  assert("postsQuerySchema validates cursor and filters", validPostsQuery.success);
  if (validPostsQuery.success) {
    assert("Parsed limit is 50", validPostsQuery.data.limit === 50);
    assert("Parsed cursor matches", validPostsQuery.data.cursor === "1699990000");
  }

  const validCommentsQuery = commentsQuerySchema.safeParse({
    limit: "50",
    cursor: "1699990000",
    sort: "oldest",
    status: "DELETED",
  });
  assert("commentsQuerySchema validates cursor and filters", validCommentsQuery.success);

  // --------------------------------------------------------------------------
  console.log("\n[TEST GROUP 6: End of Archive Exhaustion]");
  // --------------------------------------------------------------------------
  const smallMock = new MockLargeArchiveDataSource(30, 20);
  const smallPostService = new PostService(smallMock);
  const smallRes = await smallPostService.queryPosts("power_user", { limit: 50 });
  assert("Small archive returns all 30 posts", smallRes.posts.length === 30);
  assert("hasMore is false when fewer items than limit", smallRes.pagination.hasMore === false);
  assert("nextCursor is undefined when archive exhausted", smallRes.pagination.nextCursor === undefined);

  // --------------------------------------------------------------------------
  console.log("\n[TEST GROUP 7: NSFW and Status Flag Integrity]");
  // --------------------------------------------------------------------------
  const nsfwItems = chunk1.posts.filter((p) => p.isNsfw);
  assert("NSFW items correctly flagged in cursor results", nsfwItems.length > 0);
  const deletedItems = chunk1.posts.filter((p) => p.status === "DELETED");
  assert("Deleted items correctly flagged in cursor results", deletedItems.length > 0);

  // --------------------------------------------------------------------------
  console.log("\n[TEST GROUP 8: 10,000+ Item Scale Simulation]");
  // --------------------------------------------------------------------------
  console.log("  Simulating incremental browsing across 10,000 post account...");
  let totalSimulatedLoaded = 0;
  let simulatedCursor: any = undefined;
  const initialReqCount = mockDataSource.requestLog.length;

  for (let step = 0; step < 20; step++) {
    const pageRes = await postService.queryPosts("power_user", {
      limit: 50,
      cursor: simulatedCursor,
    });
    totalSimulatedLoaded += pageRes.posts.length;
    simulatedCursor = pageRes.pagination.nextCursor;
    if (!pageRes.pagination.hasMore) break;
  }

  const totalRequestsMade = mockDataSource.requestLog.length - initialReqCount;
  assert("Only requested exactly 20 chunks (not all 10,000 at once)", totalRequestsMade === 20);
  assert("Progressively loaded 1,000 items in 20 chunks of 50", totalSimulatedLoaded === 1000);
  assert("Each individual request was constrained to limit=50", mockDataSource.requestLog.slice(-20).every((r) => r.options.limit === 50));

  // --------------------------------------------------------------------------
  console.log("================================================================================");
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runInfiniteScrollTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
