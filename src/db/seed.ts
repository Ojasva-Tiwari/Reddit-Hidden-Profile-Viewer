import { db, pool } from "./index";
import {
  users,
  subreddits,
  posts,
  comments,
  provenanceMetadata,
  mediaReferences,
  aiInsights,
  evidenceLinks,
} from "./schema";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * DATABASE SEED SCRIPT (DEVELOPMENT DATA ONLY)
 * Uses explicitly fake test profiles: 'demo_user' and 'archive_test'.
 */
export async function seed() {
  console.log("Seeding development database with fake benchmark records...");

  // 1. Insert Subreddits
  const [subStarcraft, subProgramming, subRust, subTesting] = await db
    .insert(subreddits)
    .values([
      {
        redditId: "t5_2qh1i",
        name: "starcraft",
        displayName: "StarCraft",
        subscribersCount: 250000,
      },
      {
        redditId: "t5_2fwo",
        name: "programming",
        displayName: "Programming",
        subscribersCount: 5400000,
      },
      {
        redditId: "t5_2s7r3",
        name: "rust",
        displayName: "Rust",
        subscribersCount: 310000,
      },
      {
        redditId: "t5_2qgzy",
        name: "test",
        displayName: "Test Subreddit",
        subscribersCount: 50000,
      },
    ])
    .onConflictDoNothing({ target: subreddits.name })
    .returning();

  // 2. Insert Users
  const [userDemo, userArchive] = await db
    .insert(users)
    .values([
      {
        redditId: "t2_demouser123",
        username: "demo_user",
        avatarUrl: null,
        createdUtc: new Date("2019-03-15T10:00:00Z"),
        firstSeenUtc: new Date("2019-03-15T10:00:00Z"),
        lastSeenUtc: new Date("2024-08-01T15:30:00Z"),
        totalKarma: 12500,
        linkKarma: 4200,
        commentKarma: 8300,
        syncStatus: "COMPLETED",
        syncProgressPercent: 100,
      },
      {
        redditId: "t2_archivetest456",
        username: "archive_test",
        avatarUrl: null,
        createdUtc: new Date("2020-01-01T00:00:00Z"),
        firstSeenUtc: new Date("2020-01-01T00:00:00Z"),
        lastSeenUtc: new Date("2024-06-12T18:20:00Z"),
        totalKarma: 3400,
        linkKarma: 900,
        commentKarma: 2500,
        syncStatus: "COMPLETED",
        syncProgressPercent: 100,
      },
    ])
    .onConflictDoNothing({ target: users.username })
    .returning();

  if (!userDemo) {
    console.log("Users already exist or seeded.");
    return;
  }

  // 3. Insert Posts for demo_user
  const [post1, post2, post3, post4] = await db
    .insert(posts)
    .values([
      {
        redditId: "t3_demo_post_001",
        authorId: userDemo.id,
        authorUsername: userDemo.username,
        subredditId: subStarcraft?.id,
        subredditName: "starcraft",
        title: "Optimal APM burst timings in competitive Zerg gameplay",
        selftext: "Analysis of replay timings shows that at the 1:45 mark, APM spikes to ~350 during the first Overlord scout.",
        permalink: "/r/starcraft/comments/demo_post_001/",
        score: 420,
        numComments: 84,
        createdUtc: new Date("2023-09-14T11:20:00Z"),
        editedUtc: new Date("2023-09-14T13:45:00Z"),
        status: "EDITED",
        mediaStatus: "MEDIA_REFERENCE_ONLY",
      },
      {
        redditId: "t3_demo_post_002",
        authorId: userDemo.id,
        authorUsername: userDemo.username,
        subredditId: subProgramming?.id,
        subredditName: "programming",
        title: "Arena memory allocator performance in multithreaded servers",
        selftext: "Switching from standard heap allocations to per-frame arena allocators reduced latency by 80%.",
        permalink: "/r/programming/comments/demo_post_002/",
        score: 1850,
        numComments: 210,
        createdUtc: new Date("2022-04-10T14:30:00Z"),
        status: "VISIBLE",
        mediaStatus: "MEDIA_AVAILABLE",
      },
      {
        redditId: "t3_demo_post_003",
        authorId: userDemo.id,
        authorUsername: userDemo.username,
        subredditId: subStarcraft?.id,
        subredditName: "starcraft",
        title: "[Removed by Moderator] Analysis of private tournament server exploits",
        selftext: "[Content removed by moderators due to rule violation]",
        permalink: "/r/starcraft/comments/demo_post_003/",
        score: 45,
        numComments: 12,
        createdUtc: new Date("2021-11-05T08:15:00Z"),
        status: "REMOVED",
        mediaStatus: "MEDIA_UNAVAILABLE",
      },
      {
        redditId: "t3_demo_post_004",
        authorId: userDemo.id,
        authorUsername: userDemo.username,
        subredditId: subTesting?.id,
        subredditName: "test",
        title: "[Deleted by User] Temporary test question",
        selftext: "[Content deleted by author]",
        permalink: "/r/test/comments/demo_post_004/",
        score: 1,
        numComments: 0,
        createdUtc: new Date("2020-05-01T12:00:00Z"),
        status: "DELETED",
        mediaStatus: "MEDIA_UNAVAILABLE",
      },
    ])
    .onConflictDoNothing({ target: posts.redditId })
    .returning();

  // 4. Insert Comments
  const [comment1, comment2] = await db
    .insert(comments)
    .values([
      {
        redditId: "t1_demo_comment_001",
        postId: post2?.id,
        postRedditId: "t3_demo_post_002",
        parentId: "t3_demo_post_002",
        authorId: userDemo.id,
        authorUsername: userDemo.username,
        subredditId: subRust?.id,
        subredditName: "rust",
        body: "The borrow checker prevents this exact race condition at compile time without runtime lock overhead.",
        score: 85,
        createdUtc: new Date("2022-04-10T15:00:00Z"),
        editedUtc: new Date("2022-04-10T15:30:00Z"),
        status: "EDITED",
      },
      {
        redditId: "t1_demo_comment_002",
        postId: post1?.id,
        postRedditId: "t3_demo_post_001",
        parentId: "t3_demo_post_001",
        authorId: userDemo.id,
        authorUsername: userDemo.username,
        subredditId: subStarcraft?.id,
        subredditName: "starcraft",
        body: "Yes, this pattern resets roughly every 15 seconds during macro phases.",
        score: 42,
        createdUtc: new Date("2023-09-14T12:05:00Z"),
        status: "VISIBLE",
      },
    ])
    .onConflictDoNothing({ target: comments.redditId })
    .returning();

  // 5. Insert Provenance History
  if (post1) {
    await db.insert(provenanceMetadata).values([
      {
        targetType: "POST",
        targetId: post1.id,
        targetRedditId: post1.redditId,
        versionNumber: 1,
        statusAtSnapshot: "VISIBLE",
        previousContent: null,
        currentContent: "Initial draft without 1:45 timestamp correlation.",
        recordedAt: new Date("2023-09-14T11:20:00Z"),
        sourceOrigin: "ARCTIC_SHIFT",
      },
      {
        targetType: "POST",
        targetId: post1.id,
        targetRedditId: post1.redditId,
        versionNumber: 2,
        statusAtSnapshot: "EDITED",
        previousContent: "Initial draft without 1:45 timestamp correlation.",
        currentContent: post1.selftext,
        diffPatch: "@@ -1,3 +1,3 @@\n-Draft\n+1:45 mark APM burst correlation",
        recordedAt: new Date("2023-09-14T13:45:00Z"),
        sourceOrigin: "ARCTIC_SHIFT",
      },
    ]);
  }

  // 6. Insert Media References
  if (post2) {
    await db.insert(mediaReferences).values([
      {
        postId: post2.id,
        mediaUrl: "https://i.redd.it/demo_benchmark_graph.png",
        thumbnailUrl: "https://preview.redd.it/demo_benchmark_thumb.jpg",
        mediaType: "IMAGE",
        status: "MEDIA_AVAILABLE",
        httpStatusCode: 200,
        lastCheckedAt: new Date(),
      },
    ]);
  }

  // 7. Insert AI Insight and Evidence Link
  const [insight1] = await db
    .insert(aiInsights)
    .values([
      {
        userId: userDemo.id,
        insightIndex: 1,
        category: "TECH_PROFESSION",
        title: "Systems Software Engineer with Memory Allocator Focus",
        finding: "Demonstrates repeated technical discussion of arena memory allocators and low-level multithreaded backend engineering.",
        confidence: "HIGH",
        classification: "EXPLICIT",
        reasoning: "Explicitly states 'In our high-performance game backend services...' in r/programming.",
        modelVersion: "gemini-2.0-flash",
      },
    ])
    .onConflictDoNothing({ target: [aiInsights.userId, aiInsights.insightIndex] })
    .returning();

  if (insight1 && post2) {
    await db.insert(evidenceLinks).values([
      {
        insightId: insight1.id,
        postId: post2.id,
        redditFullname: post2.redditId,
        quoteSnippet: "Switching from standard heap allocations to per-frame arena allocators reduced latency by 80%.",
        relevanceScore: "0.95",
      },
    ]);
  }

  console.log("✓ Database seeded successfully with development records.");
}

// Allow direct CLI execution
if (require.main === module) {
  seed()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
