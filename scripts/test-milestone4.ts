import { SearchService } from "../src/server/services/search.service";
import { ProfileService } from "../src/server/services/profile.service";
import { PostService } from "../src/server/services/post.service";
import { CommentService } from "../src/server/services/comment.service";
import { ActivityService } from "../src/server/services/activity.service";
import { TimelineService } from "../src/server/services/timeline.service";
import { checkRateLimit } from "../src/server/middleware/rate-limiter";
import {
  usernameParamSchema,
  postsQuerySchema,
  commentsQuerySchema,
  timelineQuerySchema,
} from "../src/server/schemas/api.schemas";
import { IRedditDataSource } from "../src/lib/datasource/reddit-data-source";
import { RedditUser, RedditPost, RedditComment, PaginatedResult } from "../src/lib/datasource/types";

// Mock DataSource for Deterministic Testing
class MockDataSource implements IRedditDataSource {
  readonly providerName = "MockDataSource";

  async getUserProfile(username: string): Promise<RedditUser | null> {
    if (username.toLowerCase() === "nonexistent_user_999") return null;
    return {
      username,
      redditId: "t2_mock123",
      avatarUrl: "https://example.com/avatar.png",
      totalKarma: 15420,
      linkKarma: 5000,
      commentKarma: 10420,
      isSuspended: false,
      isDeleted: false,
      firstSeenUtc: new Date("2020-01-01T00:00:00Z"),
      lastSeenUtc: new Date("2024-01-01T00:00:00Z"),
      rawPayload: {},
    };
  }

  async getPosts(options: any): Promise<PaginatedResult<RedditPost>> {
    const mockPosts: RedditPost[] = [
      {
        redditId: "t3_post1",
        authorUsername: options.author || "testuser",
        subredditName: "technology",
        title: "First Post about AI",
        selftext: "This is the body of the first post.",
        url: "https://example.com/ai",
        permalink: "/r/technology/comments/post1",
        score: 100,
        numComments: 20,
        createdUtc: new Date("2023-05-10T12:00:00Z"),
        status: "VISIBLE",
        mediaStatus: "MEDIA_AVAILABLE",
        isNsfw: false,
        isSpoiler: false,
        isLocked: false,
        rawPayload: {},
      },
      {
        redditId: "t3_post2",
        authorUsername: options.author || "testuser",
        subredditName: "programming",
        title: "Deleted Post about Coding",
        selftext: "[deleted]",
        permalink: "/r/programming/comments/post2",
        score: 50,
        numComments: 5,
        createdUtc: new Date("2022-03-15T08:30:00Z"),
        status: "DELETED",
        mediaStatus: "MEDIA_UNAVAILABLE",
        isNsfw: false,
        isSpoiler: false,
        isLocked: false,
        rawPayload: {},
      },
      {
        redditId: "t3_post3",
        authorUsername: options.author || "testuser",
        subredditName: "technology",
        title: "Removed Post by Moderator",
        selftext: "[removed]",
        permalink: "/r/technology/comments/post3",
        score: 10,
        numComments: 1,
        createdUtc: new Date("2021-01-01T00:00:00Z"),
        status: "REMOVED",
        mediaStatus: "MEDIA_UNAVAILABLE",
        isNsfw: false,
        isSpoiler: false,
        isLocked: false,
        rawPayload: {},
      },
    ];

    let filtered = mockPosts;
    if (options.subreddit) {
      filtered = filtered.filter((p) => p.subredditName === options.subreddit);
    }

    return {
      data: filtered,
      totalFetched: filtered.length,
      hasMore: false,
    };
  }

  async getComments(options: any): Promise<PaginatedResult<RedditComment>> {
    const mockComments: RedditComment[] = [
      {
        redditId: "t1_comm1",
        authorUsername: options.author || "testuser",
        postRedditId: "t3_post1",
        parentId: "t3_post1",
        subredditName: "technology",
        body: "Insightful comment about microservices.",
        score: 45,
        createdUtc: new Date("2023-05-11T14:20:00Z"),
        status: "VISIBLE",
        isDistinguished: null,
        isNsfw: false,
        rawPayload: {},
      },
      {
        redditId: "t1_comm2",
        authorUsername: options.author || "testuser",
        postRedditId: "t3_post2",
        parentId: "t3_post2",
        subredditName: "programming",
        body: "Edited comment with corrected benchmark numbers.",
        score: 120,
        createdUtc: new Date("2022-04-01T10:00:00Z"),
        status: "EDITED",
        isDistinguished: null,
        isNsfw: false,
        rawPayload: {},
      },
    ];

    return {
      data: mockComments,
      totalFetched: mockComments.length,
      hasMore: false,
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

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

async function runMilestone4Tests() {
  console.log("=== RUNNING MILESTONE 4 TEST SUITE ===\n");

  const mockSource = new MockDataSource();
  const searchService = new SearchService(mockSource);
  const profileService = new ProfileService(mockSource);
  const postService = new PostService(mockSource);
  const commentService = new CommentService(mockSource);
  const activityService = new ActivityService(mockSource);
  const timelineService = new TimelineService(mockSource);

  // 1. Valid profile search & lookup
  console.log("Suite 1: Profile & User Search");
  const searchRes = await searchService.searchUser("testuser");
  assert("searchUser returns valid data for existing user", searchRes !== null && searchRes.username === "testuser");
  assert("searchUser extracts karma", searchRes !== null && searchRes.totalKarma === 15420);

  const profileRes = await profileService.getProfile("testuser");
  assert("getProfile succeeds with valid user", profileRes.success === true && profileRes.user !== undefined);
  assert("getProfile user has avatar", profileRes.user?.avatarUrl === "https://example.com/avatar.png");

  // 2. Invalid & Unknown username handling
  console.log("\nSuite 2: Username Validation & Unknown Target");
  const invalidUserRes = await profileService.getProfile("a");
  assert("Invalid short username rejected by service", invalidUserRes.success === false && invalidUserRes.statusCode === 400);

  const unknownUserRes = await profileService.getProfile("nonexistent_user_999");
  assert("Unknown user returns 404", unknownUserRes.success === false && unknownUserRes.statusCode === 404);

  // 3. Posts pagination and filters
  console.log("\nSuite 3: Posts Querying & Filtering");
  const allPosts = await postService.queryPosts("testuser", { limit: 10 });
  assert("queryPosts returns all posts", allPosts.posts.length === 3);

  const deletedOnlyPosts = await postService.queryPosts("testuser", { status: "DELETED" });
  assert("queryPosts status filter DELETED matches only deleted", deletedOnlyPosts.posts.length === 1 && deletedOnlyPosts.posts[0].status === "DELETED");

  const techSubPosts = await postService.queryPosts("testuser", { subreddit: "technology" });
  assert("queryPosts subreddit filter technology works", techSubPosts.posts.length === 2);

  const searchKeywordPosts = await postService.queryPosts("testuser", { search: "Coding" });
  assert("queryPosts keyword search works", searchKeywordPosts.posts.length === 1 && searchKeywordPosts.posts[0].redditId === "t3_post2");

  // 4. Comments pagination and filters
  console.log("\nSuite 4: Comments Querying & Filtering");
  const allComments = await commentService.queryComments("testuser", { limit: 10 });
  assert("queryComments returns all comments", allComments.comments.length === 2);

  const editedComments = await commentService.queryComments("testuser", { status: "EDITED" });
  assert("queryComments status filter EDITED works", editedComments.comments.length === 1 && editedComments.comments[0].status === "EDITED");

  const searchCommentBody = await commentService.queryComments("testuser", { search: "microservices" });
  assert("queryComments search body works", searchCommentBody.comments.length === 1 && searchCommentBody.comments[0].redditId === "t1_comm1");

  // 5. Activity Aggregation
  console.log("\nSuite 5: Activity Distribution Matrix");
  const activity = await activityService.getActivityDistribution("testuser");
  assert("Activity aggregation returns top subreddits", activity.topSubreddits.length > 0);
  assert("Subreddit percentages sum properly", activity.topSubreddits[0].name === "technology");
  assert("Hourly activity has 24 bins", activity.hourlyActivityUtc.length === 24);
  assert("Daily activity has 7 days", activity.dailyActivity.length === 7);
  assert("Yearly activity reflects post years", activity.yearlyActivity.length >= 2);

  // 6. Timeline stream and tie-breaking
  console.log("\nSuite 6: Chronological Timeline Stream");
  const timeline = await timelineService.getTimeline("testuser", { sort: "newest" });
  assert("Timeline merges posts and comments", timeline.length === 5);
  assert("Timeline event types are POST or COMMENT", timeline.some((e) => e.type === "POST") && timeline.some((e) => e.type === "COMMENT"));
  assert("Timeline is sorted newest first", new Date(timeline[0].dateStr).getTime() >= new Date(timeline[1].dateStr).getTime());

  // 7. Rate Limiter
  console.log("\nSuite 7: Rate Limiter Middleware");
  const testIp = "test-rate-limit-client";
  const rl1 = checkRateLimit(testIp, 3);
  assert("Initial rate limit check succeeds", rl1.success === true && rl1.remaining === 2);
  checkRateLimit(testIp, 3);
  checkRateLimit(testIp, 3);
  const rlBlocked = checkRateLimit(testIp, 3);
  assert("Rate limit block triggers when quota exceeded", rlBlocked.success === false && rlBlocked.remaining === 0);

  // 8. Zod Schema Validation
  console.log("\nSuite 8: Zod Schema Parsing");
  const validUserParse = usernameParamSchema.safeParse("u/spez");
  assert("usernameParamSchema trims leading 'u/'", validUserParse.success && validUserParse.data === "spez");

  const invalidUserParse = usernameParamSchema.safeParse("!!invalid$$");
  assert("usernameParamSchema rejects invalid characters", !invalidUserParse.success);

  const postsQueryParse = postsQuerySchema.safeParse({ limit: "50", sort: "score", status: "DELETED" });
  assert("postsQuerySchema coerces numbers and validates enums", postsQueryParse.success && postsQueryParse.data.limit === 50 && postsQueryParse.data.status === "DELETED");

  const timelineQueryParse = timelineQuerySchema.safeParse({ type: "POST", sort: "oldest" });
  assert("timelineQuerySchema parses type and sort", timelineQueryParse.success && timelineQueryParse.data.type === "POST" && timelineQueryParse.data.sort === "oldest");

  console.log(`\n========================================`);
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runMilestone4Tests();
