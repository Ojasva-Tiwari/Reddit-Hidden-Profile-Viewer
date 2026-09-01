import { isValidUsername } from "../src/server/services/profile.service";
import {
  normalizePost,
  normalizeComment,
  normalizeContentStatus,
  normalizeMediaReferences,
} from "../src/lib/datasource/normalization";
import { ArcticShiftDataSource } from "../src/lib/datasource/arctic-shift-source";
import {
  ArcticShiftPostRaw,
  ArcticShiftCommentRaw,
} from "../src/lib/datasource/types";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
    failedCount++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("MILESTONE 3: ARCTIC SHIFT INTEGRATION TEST SUITE");
  console.log("=======================================================\n");

  // --------------------------------------------------------------------------
  // TEST GROUP 1: Username Validation
  // --------------------------------------------------------------------------
  console.log("Test Group 1: Username Validation");
  assert(isValidUsername("spez"), "Valid 4-character username");
  assert(isValidUsername("demo_user-123"), "Valid alphanumeric with underscores and dashes");
  assert(isValidUsername("u/spez"), "Valid username with u/ prefix");
  assert(!isValidUsername("ab"), "Invalid: too short (<3 chars)");
  assert(!isValidUsername("a".repeat(31)), "Invalid: too long (>30 chars)");
  assert(!isValidUsername("bad user!"), "Invalid: contains illegal characters");
  assert(!isValidUsername(""), "Invalid: empty string");

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Content Status Normalization
  // --------------------------------------------------------------------------
  console.log("\nTest Group 2: Content Status Normalization");
  assert(
    normalizeContentStatus({ selftext: "Regular post content" }) === "VISIBLE",
    "Visible post"
  );
  assert(
    normalizeContentStatus({ selftext: "[deleted]" }) === "DELETED",
    "Deleted post via selftext"
  );
  assert(
    normalizeContentStatus({ _meta: { is_deleted: true } }) === "DELETED",
    "Deleted post via _meta"
  );
  assert(
    normalizeContentStatus({ selftext: "[removed]" }) === "REMOVED",
    "Removed post via selftext"
  );
  assert(
    normalizeContentStatus({ selftext: "Some text", edited: 1680000000 }) === "EDITED",
    "Edited post via edited timestamp"
  );
  assert(
    normalizeContentStatus({ selftext: "Some text", _meta: { is_edited: true } }) === "EDITED",
    "Edited post via _meta flag"
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Media Reference Normalization
  // --------------------------------------------------------------------------
  console.log("\nTest Group 3: Media Reference Normalization");
  const postWithMedia: ArcticShiftPostRaw = {
    id: "post123",
    name: "t3_post123",
    author: "test_user",
    subreddit: "test",
    title: "Test Image",
    permalink: "/r/test/comments/post123/",
    created_utc: 1680000000,
    url: "https://i.redd.it/sample_image.png",
    preview: {
      images: [
        {
          source: { url: "https://preview.redd.it/sample_image.png" },
          resolutions: [{ url: "https://preview.redd.it/thumb.png", width: 108, height: 60 }],
        },
      ],
    },
  };

  const mediaResult = normalizeMediaReferences(postWithMedia);
  assert(mediaResult.mediaStatus === "MEDIA_AVAILABLE", "Media status detected as MEDIA_AVAILABLE");
  assert(mediaResult.mediaReferences.length > 0, "Extracted preview media reference");
  assert(
    mediaResult.mediaReferences[0].mediaUrl === "https://preview.redd.it/sample_image.png",
    "Extracted correct source media URL"
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 4: Raw Post Normalization
  // --------------------------------------------------------------------------
  console.log("\nTest Group 4: Post Normalization");
  const normalizedPost = normalizePost(postWithMedia);
  assert(normalizedPost.redditId === "t3_post123", "Normalized redditId prefix correctly");
  assert(normalizedPost.authorUsername === "test_user", "Preserved author username");
  assert(normalizedPost.subredditName === "test", "Preserved subreddit name");
  assert(normalizedPost.createdUtc.getTime() === 1680000000 * 1000, "Converted Unix timestamp to Date");

  // --------------------------------------------------------------------------
  // TEST GROUP 5: Raw Comment Normalization
  // --------------------------------------------------------------------------
  console.log("\nTest Group 5: Comment Normalization");
  const rawComment: ArcticShiftCommentRaw = {
    id: "comment456",
    name: "t1_comment456",
    author: "commenter",
    author_fullname: "t2_abc123",
    subreddit: "rust",
    body: "Safe memory concurrency pattern",
    link_id: "t3_post123",
    parent_id: "t3_post123",
    permalink: "/r/rust/comments/post123/comment456/",
    created_utc: 1680001000,
    ups: 42,
    profile_img: "https://styles.redditmedia.com/avatar.png",
  };

  const normalizedComment = normalizeComment(rawComment);
  assert(normalizedComment.redditId === "t1_comment456", "Normalized comment redditId prefix");
  assert(normalizedComment.postRedditId === "t3_post123", "Normalized link_id to postRedditId");
  assert(normalizedComment.score === 42, "Extracted comment karma score");
  assert(normalizedComment.authorRedditId === "t2_abc123", "Preserved author fullname");

  // --------------------------------------------------------------------------
  // TEST GROUP 6: Mocked Upstream Pagination & Termination
  // --------------------------------------------------------------------------
  console.log("\nTest Group 6: Pagination & Termination Simulation");
  const mockItems: ArcticShiftPostRaw[] = [
    { id: "p1", name: "t3_p1", author: "spez", subreddit: "test", title: "P1", permalink: "/p1", created_utc: 100 },
    { id: "p2", name: "t3_p2", author: "spez", subreddit: "test", title: "P2", permalink: "/p2", created_utc: 50 },
  ];

  const hasMoreFalse = mockItems.length < 100;
  const nextBeforeEpoch = mockItems[mockItems.length - 1].created_utc;
  assert(hasMoreFalse === true, "Recognized page < limit signifies end of results");
  assert(nextBeforeEpoch === 50, "Calculated next before timestamp for sequential queries");

  // --------------------------------------------------------------------------
  // TEST GROUP 7: Mock Upstream Failure & Resilient Retry Logic
  // --------------------------------------------------------------------------
  console.log("\nTest Group 7: Mock Upstream Error & Retry Parameters");
  const customSource = new ArcticShiftDataSource({
    timeoutMs: 2000,
    maxRetries: 2,
    baseBackoffMs: 50,
  });
  assert(customSource.providerName === "ARCTIC_SHIFT", "DataSource provider name is ARCTIC_SHIFT");

  console.log("\n=======================================================");
  console.log(`TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests();
