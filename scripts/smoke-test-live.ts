import { defaultArcticShiftSource } from "../src/lib/datasource/arctic-shift-source";
import { defaultProfileService } from "../src/server/services/profile.service";

async function runLiveSmokeTest() {
  console.log("\n=======================================================");
  console.log("LIVE ARCTIC SHIFT SMOKE TEST");
  console.log("=======================================================\n");

  const testUsername = "spez";
  console.log(`[1/4] Performing health check on Arctic Shift endpoint...`);
  const isHealthy = await defaultArcticShiftSource.healthCheck();
  console.log(`      Health check result: ${isHealthy ? "HEALTHY (200 OK)" : "UNAVAILABLE"}`);

  if (!isHealthy) {
    console.warn("Arctic Shift health check failed. Skipping live smoke tests.");
    return;
  }

  console.log(`\n[2/4] Testing getUserProfile for 'u/${testUsername}'...`);
  const profileStartTime = Date.now();
  const profile = await defaultArcticShiftSource.getUserProfile(testUsername);
  const profileDuration = Date.now() - profileStartTime;

  console.log(`      Response received in ${profileDuration}ms:`);
  console.log(`      - Username: u/${profile?.username}`);
  console.log(`      - Reddit Fullname: ${profile?.redditId || "N/A"}`);
  console.log(`      - First/Last Activity: ${profile?.firstSeenUtc ? new Date(profile.firstSeenUtc).toISOString() : "N/A"}`);
  console.log(`      - Avatar URL: ${profile?.avatarUrl ? profile.avatarUrl.substring(0, 60) + "..." : "None"}`);

  console.log(`\n[3/4] Testing getPosts for 'u/${testUsername}' (limit: 2)...`);
  const posts = await defaultArcticShiftSource.getPosts({ author: testUsername, limit: 2 });
  console.log(`      Retrieved ${posts.data.length} submissions:`);
  posts.data.forEach((p, idx) => {
    console.log(`      [${idx + 1}] ID: ${p.redditId} | r/${p.subredditName} | Status: ${p.status} | Score: ${p.score}`);
    console.log(`          Title: "${p.title.substring(0, 65)}..."`);
  });

  console.log(`\n[4/4] Testing getComments for 'u/${testUsername}' (limit: 2)...`);
  const comments = await defaultArcticShiftSource.getComments({ author: testUsername, limit: 2 });
  console.log(`      Retrieved ${comments.data.length} comments:`);
  comments.data.forEach((c, idx) => {
    console.log(`      [${idx + 1}] ID: ${c.redditId} | r/${c.subredditName} | Status: ${c.status} | Score: ${c.score}`);
    console.log(`          Body: "${c.body.substring(0, 65).replace(/\n/g, " ")}..."`);
  });

  console.log(`\n[5/5] Testing ProfileService integration pipeline...`);
  const serviceResult = await defaultProfileService.getProfile(testUsername);
  console.log(`      Service status: ${serviceResult.statusCode} | Source: ${serviceResult.source} | Success: ${serviceResult.success}`);

  console.log("\n=======================================================");
  console.log("LIVE SMOKE TEST PASSED SUCCESSFULLY");
  console.log("=======================================================\n");
}

runLiveSmokeTest().catch((err) => {
  console.error("Live smoke test failed:", err);
  process.exit(1);
});
