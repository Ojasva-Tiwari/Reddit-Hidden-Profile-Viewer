import {
  normalizeContentStatus,
  normalizeMediaReferences,
  normalizePost,
  normalizeComment,
  extractProvenance,
} from "../src/lib/datasource/normalization";
import { TimelineService } from "../src/server/services/timeline.service";
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

// Mock Data Source with diverse status & media fixtures
class MockHistoricalDataSource implements IRedditDataSource {
  readonly providerName = "MockHistoricalDataSource";

  async getUserProfile(username: string): Promise<RedditUser | null> {
    return {
      username,
      totalKarma: 100,
      linkKarma: 50,
      commentKarma: 50,
      isSuspended: false,
      isDeleted: false,
    };
  }

  async getPosts(options: any): Promise<PaginatedResult<RedditPost>> {
    const posts: RedditPost[] = [
      {
        redditId: "t3_vis1",
        authorUsername: "alice",
        subredditName: "science",
        title: "Visible Post with Image Preview",
        selftext: "Text of visible post",
        permalink: "/r/science/comments/vis1",
        score: 500,
        numComments: 30,
        createdUtc: new Date("2023-01-01T12:00:00Z"),
        status: "VISIBLE",
        mediaStatus: "MEDIA_AVAILABLE",
        isNsfw: false,
        isSpoiler: false,
        isLocked: false,
      },
      {
        redditId: "t3_del2",
        authorUsername: "alice",
        subredditName: "science",
        title: "Deleted Later Post",
        selftext: "Preserved original text before author deleted later",
        permalink: "/r/science/comments/del2",
        score: 120,
        numComments: 4,
        createdUtc: new Date("2023-01-01T12:00:00Z"), // identical timestamp to test tie-breaking
        status: "DELETED_LATER",
        mediaStatus: "MEDIA_UNAVAILABLE",
        isNsfw: false,
        isSpoiler: false,
        isLocked: false,
      },
      {
        redditId: "t3_rem3",
        authorUsername: "alice",
        subredditName: "news",
        title: "Moderator Removed Post",
        selftext: "[removed]",
        permalink: "/r/news/comments/rem3",
        score: 10,
        numComments: 2,
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
      filtered = filtered.filter((p) => p.subredditName === options.subreddit);
    }

    return { data: filtered, totalFetched: filtered.length, hasMore: false };
  }

  async getComments(options: any): Promise<PaginatedResult<RedditComment>> {
    const comments: RedditComment[] = [
      {
        redditId: "t1_com1",
        postRedditId: "t3_vis1",
        parentId: "t3_vis1",
        authorUsername: "alice",
        subredditName: "science",
        body: "Edited comment with corrected formulas",
        score: 45,
        createdUtc: new Date("2023-01-02T10:00:00Z"),
        editedUtc: new Date("2023-01-02T11:00:00Z"),
        status: "EDITED",
        isDistinguished: null,
        isNsfw: false,
      },
      {
        redditId: "t1_com2",
        postRedditId: "t3_del2",
        parentId: "t3_del2",
        authorUsername: "alice",
        subredditName: "news",
        body: "[deleted]",
        score: 1,
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
      filtered = filtered.filter((c) => c.subredditName === options.subreddit);
    }

    return { data: filtered, totalFetched: filtered.length, hasMore: false };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

async function runMilestone5Tests() {
  console.log("=== RUNNING MILESTONE 5 TEST SUITE ===\n");

  // 1. Status Normalization
  console.log("Suite 1: Content Status Normalization");
  assert("Maps visible selftext to VISIBLE", normalizeContentStatus({ selftext: "Hello world" }) === "VISIBLE");
  assert("Maps [deleted] to DELETED", normalizeContentStatus({ selftext: "[deleted]" }) === "DELETED");
  assert("Maps [removed] to REMOVED", normalizeContentStatus({ body: "[removed]" }) === "REMOVED");
  assert("Maps edited timestamp to EDITED", normalizeContentStatus({ selftext: "Text", edited: 1672531199 }) === "EDITED");

  // 2. Deleted Later Mapping
  console.log("\nSuite 2: DELETED_LATER Mapping");
  const delLaterStatus = normalizeContentStatus({
    selftext: "Preserved original text",
    _meta: { is_deleted: true },
  });
  assert("Maps preserved text with is_deleted flag to DELETED_LATER", delLaterStatus === "DELETED_LATER");

  // 3. Initially Unavailable Mapping
  console.log("\nSuite 3: INITIALLY_UNAVAILABLE Mapping");
  const initUnavailStatus = normalizeContentStatus({
    selftext: undefined,
    body: undefined,
    title: undefined,
  });
  assert("Maps empty observation to INITIALLY_UNAVAILABLE", initUnavailStatus === "INITIALLY_UNAVAILABLE");

  // 4. Media Status Mapping
  console.log("\nSuite 4: Media Classification & Extraction");
  const postWithPreview = normalizeMediaReferences({
    id: "p1",
    author: "user",
    subreddit: "pics",
    title: "Photo",
    created_utc: 1672531200,
    permalink: "/r/pics/p1",
    preview: {
      images: [
        {
          source: { url: "https://preview.redd.it/image.jpg?width=1080&amp;s=abc" },
          resolutions: [{ url: "https://preview.redd.it/thumb.jpg?width=100&amp;s=xyz", width: 100, height: 100 }],
        },
      ],
    },
  });
  assert("Extracts preview image to MEDIA_AVAILABLE", postWithPreview.mediaStatus === "MEDIA_AVAILABLE");
  assert("Decodes XML HTML entities (&amp; -> &) in image URL", postWithPreview.mediaReferences[0].mediaUrl.includes("&s=abc"));

  const postWithThumbnailOnly = normalizeMediaReferences({
    id: "p2",
    author: "user",
    subreddit: "links",
    title: "News Link",
    created_utc: 1672531200,
    permalink: "/r/links/p2",
    thumbnail: "https://b.thumbs.redditmedia.com/thumb123.jpg",
  });
  assert("Classifies thumbnail without preview bytes as THUMBNAIL_AVAILABLE", postWithThumbnailOnly.mediaStatus === "THUMBNAIL_AVAILABLE");

  const postWithExternalMediaUrl = normalizeMediaReferences({
    id: "p3",
    author: "user",
    subreddit: "gifs",
    title: "External Gif",
    created_utc: 1672531200,
    permalink: "/r/gifs/p3",
    url: "https://i.imgur.com/animation.gif",
  });
  assert("Classifies external media link without preview bytes as MEDIA_REFERENCE_ONLY", postWithExternalMediaUrl.mediaStatus === "MEDIA_REFERENCE_ONLY");

  const postWithoutMedia = normalizeMediaReferences({
    id: "p4",
    author: "user",
    subreddit: "askreddit",
    title: "Text question",
    created_utc: 1672531200,
    permalink: "/r/askreddit/p4",
    url: "https://www.reddit.com/r/askreddit/comments/p4",
  });
  assert("Classifies text post as MEDIA_UNAVAILABLE", postWithoutMedia.mediaStatus === "MEDIA_UNAVAILABLE");

  // 5. Provenance Extraction & History
  console.log("\nSuite 5: Provenance Extraction");
  const postNormalized = normalizePost({
    id: "post123",
    author: "bob",
    subreddit: "tech",
    title: "Original Title",
    selftext: "Original body text",
    created_utc: 1672531200,
    edited: 1672534800,
    permalink: "/r/tech/post123",
    _meta: { is_edited: true },
  });
  assert("normalizePost extracts editedUtc Date", postNormalized.editedUtc !== null && postNormalized.editedUtc?.getTime() === 1672534800000);
  const prov = extractProvenance(postNormalized);
  assert("extractProvenance derives snapshot for edited post", prov !== null && prov.versionNumber === 2 && prov.statusAtSnapshot === "EDITED");

  // 6. Timeline Mixed Ordering & Tie Breaking
  console.log("\nSuite 6: Timeline Merging & Deterministic Tie-Breaking");
  const mockSource = new MockHistoricalDataSource();
  const timelineService = new TimelineService(mockSource);
  const timeline = await timelineService.getTimeline("alice", { sort: "newest" });
  assert("Timeline merges posts and comments (5 items)", timeline.length === 5);

  // Check tie-breaking between identical timestamps (t3_vis1 and t3_del2)
  const sameTimeEvents = timeline.filter((e) => e.dateStr === "2023-01-01");
  assert("Deterministic tie-breaking groups identical date records", sameTimeEvents.length === 2);
  assert("Tie-breaking uses alphanumeric sort on redditId", sameTimeEvents[0].redditId.localeCompare(sameTimeEvents[1].redditId) > 0);

  // 7. Combined Filters
  console.log("\nSuite 7: Combined Filters");
  const filteredTimeline = await timelineService.getTimeline("alice", { type: "POST", status: "VISIBLE" });
  assert("Filtering timeline by type=POST and status=VISIBLE returns matching item", filteredTimeline.length === 1 && filteredTimeline[0].redditId === "t3_vis1");

  // 8. Malformed Metadata Resilience
  console.log("\nSuite 8: Malformed Metadata Resilience");
  const malformedPost = normalizePost({
    id: "malformed_1",
    author: "unknown",
    subreddit: "test",
    created_utc: 0,
    permalink: "",
    title: undefined as any,
    selftext: null as any,
    url: undefined,
  });
  assert("normalizePost gracefully defaults null title and selftext", malformedPost.title === "" && malformedPost.selftext === "");
  assert("normalizePost gracefully handles created_utc 0", malformedPost.createdUtc.getFullYear() === 1970);

  console.log(`\n========================================`);
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runMilestone5Tests();
