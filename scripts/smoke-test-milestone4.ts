import { defaultSearchService } from "../src/server/services/search.service";
import { defaultProfileService } from "../src/server/services/profile.service";
import { defaultPostService } from "../src/server/services/post.service";
import { defaultCommentService } from "../src/server/services/comment.service";
import { defaultActivityService } from "../src/server/services/activity.service";
import { defaultTimelineService } from "../src/server/services/timeline.service";

async function runLiveSmokeTest() {
  console.log("=== MILESTONE 4 LIVE SMOKE TEST (Target: u/spez) ===\n");

  const target = "spez";

  // 1. Search User
  console.log(`[Stage 1/6] Live Search for u/${target}...`);
  const searchResult = await defaultSearchService.searchUser(target);
  if (!searchResult) {
    throw new Error(`Failed to search live user u/${target}`);
  }
  console.log(`  ✓ Search matched: u/${searchResult.username} (Karma: ${searchResult.totalKarma}, Source: ${searchResult.source})`);

  // 2. Profile Details
  console.log(`\n[Stage 2/6] Live Profile Fetch for u/${target}...`);
  const profileResult = await defaultProfileService.getProfile(target);
  if (!profileResult.success || !profileResult.user) {
    throw new Error(`Failed to get live profile for u/${target}`);
  }
  console.log(`  ✓ Profile loaded: u/${profileResult.user.username} (LinkKarma: ${profileResult.user.linkKarma}, CommentKarma: ${profileResult.user.commentKarma})`);

  // 3. Posts Feed
  console.log(`\n[Stage 3/6] Live Posts Feed Query (limit: 5)...`);
  const postsResult = await defaultPostService.queryPosts(target, { limit: 5 });
  console.log(`  ✓ Fetched ${postsResult.posts.length} posts (Source: ${postsResult.source})`);
  if (postsResult.posts.length > 0) {
    console.log(`    Sample: "${postsResult.posts[0].title.substring(0, 50)}..." in r/${postsResult.posts[0].subreddit}`);
  }

  // 4. Comments Feed
  console.log(`\n[Stage 4/6] Live Comments Feed Query (limit: 5)...`);
  const commentsResult = await defaultCommentService.queryComments(target, { limit: 5 });
  console.log(`  ✓ Fetched ${commentsResult.comments.length} comments (Source: ${commentsResult.source})`);
  if (commentsResult.comments.length > 0) {
    console.log(`    Sample: "${commentsResult.comments[0].body.substring(0, 50)}..." in r/${commentsResult.comments[0].subreddit}`);
  }

  // 5. Activity Distribution
  console.log(`\n[Stage 5/6] Activity Distribution Synthesis...`);
  const activityResult = await defaultActivityService.getActivityDistribution(target);
  console.log(`  ✓ Top subreddits calculated (${activityResult.topSubreddits.length} communities)`);
  if (activityResult.topSubreddits.length > 0) {
    console.log(`    Top: r/${activityResult.topSubreddits[0].name} (${activityResult.topSubreddits[0].percentage}%)`);
  }
  console.log(`  ✓ Hourly UTC Distribution: ${activityResult.hourlyActivityUtc.length} hours computed`);

  // 6. Timeline Stream
  console.log(`\n[Stage 6/6] Chronological Timeline Construction (limit: 10)...`);
  const timelineEvents = await defaultTimelineService.getTimeline(target, { limit: 10 });
  console.log(`  ✓ Constructed timeline stream with ${timelineEvents.length} merged events`);
  if (timelineEvents.length > 0) {
    console.log(`    First event: [${timelineEvents[0].type}] ${timelineEvents[0].dateStr} - "${timelineEvents[0].title}"`);
  }

  console.log("\n========================================");
  console.log("ALL LIVE SMOKE TEST STAGES PASSED!");
  console.log("========================================\n");
}

runLiveSmokeTest().catch((err) => {
  console.error("Live smoke test failed:", err);
  process.exit(1);
});
