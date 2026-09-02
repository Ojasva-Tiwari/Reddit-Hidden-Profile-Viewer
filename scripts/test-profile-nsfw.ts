import {
  normalizePost,
  normalizeComment,
} from "../src/lib/datasource/normalization";
import { TimelineService } from "../src/server/services/timeline.service";
import { PostService } from "../src/server/services/post.service";
import { CommentService } from "../src/server/services/comment.service";
import { ProfileService } from "../src/server/services/profile.service";
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

// Mock data source for testing
class MockProfileNsfwDataSource implements IRedditDataSource {
  readonly providerName = "MockProfileNsfwDataSource";

  constructor(
    private mockUser: RedditUser | null,
    private mockPosts: RedditPost[] = [],
    private mockComments: RedditComment[] = []
  ) {}

  async getUserProfile(username: string): Promise<RedditUser | null> {
    return this.mockUser;
  }

  async getPosts(options: any): Promise<PaginatedResult<RedditPost>> {
    return { data: this.mockPosts, totalFetched: this.mockPosts.length, hasMore: false };
  }

  async getComments(options: any): Promise<PaginatedResult<RedditComment>> {
    return { data: this.mockComments, totalFetched: this.mockComments.length, hasMore: false };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

async function runProfileMetadataAndNsfwTests() {
  console.log("=== RUNNING PROFILE METADATA + NSFW TEST SUITE ===\n");

  // =========================================================================
  // 1. Correct Karma Mapping
  // =========================================================================
  console.log("1. Correct Karma Mapping");
  const verifiedUser: RedditUser = {
    username: "test_karma_user",
    totalKarma: 48290,
    linkKarma: 14200,
    commentKarma: 34090,
    createdUtc: new Date("2020-01-01T00:00:00Z"),
    firstSeenUtc: new Date("2021-01-01T00:00:00Z"),
    isSuspended: false,
    isDeleted: false,
  };
  const profileServiceWithKarma = new ProfileService(new MockProfileNsfwDataSource(verifiedUser));
  const karmaResult = await profileServiceWithKarma.getProfile("test_karma_user");
  assert("Profile service returns verified totalKarma (48290)", karmaResult.user?.totalKarma === 48290);
  assert("Profile service returns verified linkKarma (14200)", karmaResult.user?.linkKarma === 14200);
  assert("Profile service returns verified commentKarma (34090)", karmaResult.user?.commentKarma === 34090);

  // =========================================================================
  // 2. Missing Karma -> returns null (triggers 'Karma unavailable' in UI)
  // =========================================================================
  console.log("\n2. Missing Karma Mapping");
  const missingKarmaUser: RedditUser = {
    username: "no_karma_user",
    totalKarma: null,
    linkKarma: null,
    commentKarma: null,
    createdUtc: new Date("2020-01-01T00:00:00Z"),
    isSuspended: false,
    isDeleted: false,
  };
  const profileServiceNoKarma = new ProfileService(new MockProfileNsfwDataSource(missingKarmaUser));
  const noKarmaResult = await profileServiceNoKarma.getProfile("no_karma_user");
  assert("Profile service returns totalKarma as null when unavailable", noKarmaResult.user?.totalKarma === null);
  assert("Does not fabricate 0 for missing karma", noKarmaResult.user?.totalKarma !== 0);

  // =========================================================================
  // 3. Separate Post / Comment Karma
  // =========================================================================
  console.log("\n3. Separate Post / Comment Karma");
  const splitKarmaUser: RedditUser = {
    username: "split_karma_user",
    totalKarma: null,
    linkKarma: 5000,
    commentKarma: 12000,
    isSuspended: false,
    isDeleted: false,
  };
  const profileServiceSplitKarma = new ProfileService(new MockProfileNsfwDataSource(splitKarmaUser));
  const splitKarmaResult = await profileServiceSplitKarma.getProfile("split_karma_user");
  assert("Preserves separate linkKarma (5000)", splitKarmaResult.user?.linkKarma === 5000);
  assert("Preserves separate commentKarma (12000)", splitKarmaResult.user?.commentKarma === 12000);

  // =========================================================================
  // 4. Correct Account Creation Timestamp
  // =========================================================================
  console.log("\n4. Correct Account Creation Timestamp");
  const timestampDate = new Date("2018-04-12T14:32:00Z");
  const userWithCreatedDate: RedditUser = {
    username: "created_user",
    createdUtc: timestampDate,
    firstSeenUtc: new Date("2019-05-01T00:00:00Z"),
    isSuspended: false,
    isDeleted: false,
  };
  const profileServiceCreatedDate = new ProfileService(new MockProfileNsfwDataSource(userWithCreatedDate));
  const createdDateResult = await profileServiceCreatedDate.getProfile("created_user");
  assert("Profile returns ISO createdUtc string matching exact date", createdDateResult.user?.createdUtc === timestampDate.toISOString());
  assert("Calculates accountAgeYears accurately from exact createdUtc", typeof createdDateResult.user?.accountAgeYears === "number" && createdDateResult.user.accountAgeYears > 0);

  // =========================================================================
  // 5. Missing Account Creation Timestamp -> null (triggers 'Join date unavailable')
  // =========================================================================
  console.log("\n5. Missing Account Creation Timestamp");
  const userWithoutCreatedDate: RedditUser = {
    username: "unknown_date_user",
    createdUtc: null,
    firstSeenUtc: new Date("2022-03-01T00:00:00Z"),
    isSuspended: false,
    isDeleted: false,
  };
  const profileServiceNoCreatedDate = new ProfileService(new MockProfileNsfwDataSource(userWithoutCreatedDate));
  const noCreatedDateResult = await profileServiceNoCreatedDate.getProfile("unknown_date_user");
  assert("Profile returns createdUtc as null when unavailable", noCreatedDateResult.user?.createdUtc === null);
  assert("Does not fabricate current date for missing createdUtc", noCreatedDateResult.user?.createdUtc !== new Date().toISOString());

  // =========================================================================
  // 6. first_seen != account_created_at Distinction
  // =========================================================================
  console.log("\n6. Distinction between first_seen_utc and created_utc");
  const createdTimestamp = new Date("2015-06-15T00:00:00Z");
  const firstSeenTimestamp = new Date("2021-08-20T10:00:00Z");
  const distinctDateUser: RedditUser = {
    username: "distinct_user",
    createdUtc: createdTimestamp,
    firstSeenUtc: firstSeenTimestamp,
    isSuspended: false,
    isDeleted: false,
  };
  const profileServiceDistinctDates = new ProfileService(new MockProfileNsfwDataSource(distinctDateUser));
  const distinctDateResult = await profileServiceDistinctDates.getProfile("distinct_user");
  assert("createdUtc is distinct from firstSeenUtc", distinctDateResult.user?.createdUtc !== distinctDateResult.user?.firstSeenUtc);
  assert("firstSeenUtc matches archival observation date", distinctDateResult.user?.firstSeenUtc === firstSeenTimestamp.toISOString());
  assert("createdUtc matches Reddit registration date", distinctDateResult.user?.createdUtc === createdTimestamp.toISOString());

  // =========================================================================
  // 7. NSFW Post Detection
  // =========================================================================
  console.log("\n7. NSFW Post Detection (over_18 = true)");
  const nsfwPostRaw = {
    id: "nsfw_post_1",
    author: "author1",
    subreddit: "pics",
    title: "Explicit NSFW Post",
    created_utc: 1672531200,
    permalink: "/r/pics/comments/nsfw_post_1",
    over_18: true,
  };
  const normalizedNsfwPost = normalizePost(nsfwPostRaw);
  assert("Normalizes over_18 post to isNsfw: true", normalizedNsfwPost.isNsfw === true);

  // =========================================================================
  // 8. Non-NSFW Post Detection
  // =========================================================================
  console.log("\n8. Non-NSFW Post Detection (over_18 = false)");
  const sfwPostRaw = {
    id: "sfw_post_1",
    author: "author1",
    subreddit: "technology",
    title: "Normal Tech Post",
    created_utc: 1672531200,
    permalink: "/r/technology/comments/sfw_post_1",
    over_18: false,
  };
  const normalizedSfwPost = normalizePost(sfwPostRaw);
  assert("Normalizes regular post to isNsfw: false", normalizedSfwPost.isNsfw === false);

  // =========================================================================
  // 9. NSFW Subreddit Metadata Detection
  // =========================================================================
  console.log("\n9. NSFW Subreddit Metadata Detection");
  const postInNsfwSubredditRaw = {
    id: "sub_nsfw_post",
    author: "author1",
    subreddit: "nsfw_community",
    title: "Community Post",
    created_utc: 1672531200,
    permalink: "/r/nsfw_community/comments/sub_nsfw_post",
    over_18: false,
    subreddit_over_18: true,
  };
  const normalizedSubNsfwPost = normalizePost(postInNsfwSubredditRaw);
  assert("Normalizes post in NSFW subreddit to isNsfw: true via subreddit_over_18", normalizedSubNsfwPost.isNsfw === true);

  const commentInNsfwSubredditRaw = {
    id: "sub_nsfw_com",
    author: "author1",
    subreddit: "nsfw_community",
    body: "Comment in 18+ sub",
    link_id: "t3_xyz",
    parent_id: "t3_xyz",
    created_utc: 1672531200,
    subreddit_is_nsfw: true,
  };
  const normalizedSubNsfwComment = normalizeComment(commentInNsfwSubredditRaw);
  assert("Normalizes comment in NSFW subreddit to isNsfw: true via subreddit_is_nsfw", normalizedSubNsfwComment.isNsfw === true);

  // =========================================================================
  // 10. Unknown NSFW State
  // =========================================================================
  console.log("\n10. Unknown / Unspecified NSFW State");
  const unknownNsfwPostRaw = {
    id: "unknown_post",
    author: "author1",
    subreddit: "general",
    title: "General Title",
    created_utc: 1672531200,
    permalink: "/r/general/comments/unknown_post",
  };
  const normalizedUnknownPost = normalizePost(unknownNsfwPostRaw);
  assert("Defaults to isNsfw: false when no NSFW metadata is present (no guessing)", normalizedUnknownPost.isNsfw === false);

  // =========================================================================
  // 11. Deleted + NSFW Combination (Orthogonal States)
  // =========================================================================
  console.log("\n11. Deleted + NSFW Combination (Orthogonal States)");
  const deletedNsfwPostRaw = {
    id: "del_nsfw_post",
    author: "author1",
    subreddit: "mature_content",
    title: "Preserved Title",
    selftext: "[deleted]",
    created_utc: 1672531200,
    permalink: "/r/mature_content/comments/del_nsfw_post",
    over_18: true,
    _meta: { is_deleted: true },
  };
  const normalizedDeletedNsfwPost = normalizePost(deletedNsfwPostRaw);
  assert("Status is DELETED", normalizedDeletedNsfwPost.status === "DELETED");
  assert("isNsfw remains true independently of DELETED status", normalizedDeletedNsfwPost.isNsfw === true);

  const deletedNsfwCommentRaw = {
    id: "del_nsfw_com",
    author: "author1",
    subreddit: "mature_content",
    body: "[deleted]",
    link_id: "t3_xyz",
    parent_id: "t3_xyz",
    created_utc: 1672531200,
    over_18: true,
    _meta: { is_deleted: true },
  };
  const normalizedDeletedNsfwComment = normalizeComment(deletedNsfwCommentRaw);
  assert("Comment status is DELETED", normalizedDeletedNsfwComment.status === "DELETED");
  assert("Comment isNsfw remains true independently of DELETED status", normalizedDeletedNsfwComment.isNsfw === true);

  // =========================================================================
  // 12. Timeline NSFW Badge Propagation
  // =========================================================================
  console.log("\n12. Timeline NSFW Badge Propagation");
  const timelineMockPosts: RedditPost[] = [
    {
      redditId: "t3_tl_nsfw_post",
      authorUsername: "timeline_user",
      subredditName: "nsfw_art",
      title: "NSFW Drawing",
      selftext: "Drawing description",
      permalink: "/r/nsfw_art/comments/tl_nsfw_post",
      score: 150,
      numComments: 10,
      createdUtc: new Date("2023-05-01T12:00:00Z"),
      status: "VISIBLE",
      mediaStatus: "MEDIA_AVAILABLE",
      isNsfw: true,
      isSpoiler: false,
      isLocked: false,
    },
    {
      redditId: "t3_tl_sfw_post",
      authorUsername: "timeline_user",
      subredditName: "technology",
      title: "Tech Article",
      selftext: "Tech description",
      permalink: "/r/technology/comments/tl_sfw_post",
      score: 50,
      numComments: 2,
      createdUtc: new Date("2023-04-01T12:00:00Z"),
      status: "VISIBLE",
      mediaStatus: "MEDIA_REFERENCE_ONLY",
      isNsfw: false,
      isSpoiler: false,
      isLocked: false,
    },
  ];
  const timelineMockComments: RedditComment[] = [
    {
      redditId: "t1_tl_nsfw_comment",
      postRedditId: "t3_tl_nsfw_post",
      parentId: "t3_tl_nsfw_post",
      authorUsername: "timeline_user",
      subredditName: "nsfw_art",
      body: "NSFW comment context",
      score: 12,
      createdUtc: new Date("2023-05-02T12:00:00Z"),
      status: "VISIBLE",
      isNsfw: true,
    },
  ];
  const timelineService = new TimelineService(
    new MockProfileNsfwDataSource(null, timelineMockPosts, timelineMockComments)
  );
  const timelineEvents = await timelineService.getTimeline("timeline_user");
  const nsfwTimelinePost = timelineEvents.find((e) => e.redditId === "t3_tl_nsfw_post");
  const sfwTimelinePost = timelineEvents.find((e) => e.redditId === "t3_tl_sfw_post");
  const nsfwTimelineComment = timelineEvents.find((e) => e.redditId === "t1_tl_nsfw_comment");

  assert("Timeline includes isNsfw: true for NSFW post event", nsfwTimelinePost?.isNsfw === true);
  assert("Timeline includes isNsfw: false for SFW post event", sfwTimelinePost?.isNsfw === false);
  assert("Timeline includes isNsfw: true for NSFW comment event", nsfwTimelineComment?.isNsfw === true);

  // =========================================================================
  // 13. Post / Comment Service toPostItem / toCommentItem NSFW Mapping
  // =========================================================================
  console.log("\n13. Post / Comment Service Client DTO NSFW Mapping");
  const postDto = PostService.toPostItem(timelineMockPosts[0]);
  assert("PostService.toPostItem preserves isNsfw: true", postDto.isNsfw === true);

  const sfwPostDto = PostService.toPostItem(timelineMockPosts[1]);
  assert("PostService.toPostItem preserves isNsfw: false", sfwPostDto.isNsfw === false);

  const commentDto = CommentService.toCommentItem(timelineMockComments[0]);
  assert("CommentService.toCommentItem preserves isNsfw: true", commentDto.isNsfw === true);

  console.log(`\n========================================`);
  console.log(`TOTAL PROFILE METADATA & NSFW TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runProfileMetadataAndNsfwTests();
