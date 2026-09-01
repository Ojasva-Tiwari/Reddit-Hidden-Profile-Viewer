import { defaultAISummaryService } from "../src/server/services/ai-summary.service";
import { defaultGeminiClient } from "../src/lib/ai/gemini";

async function runMilestone6SmokeTest() {
  console.log("=== MILESTONE 6 LIVE SMOKE TEST (AI Profile Summary) ===\n");

  if (!defaultGeminiClient.isConfigured()) {
    console.log("---------------------------------------------------------");
    console.log("LIVE GEMINI TEST NOT RUN — API KEY NOT CONFIGURED");
    console.log("Set GEMINI_API_KEY in .env.local to execute live Gemini generation.");
    console.log("---------------------------------------------------------\n");
    return;
  }

  const target = "spez";
  console.log(`Executing controlled live Gemini summary synthesis for target u/${target}...`);

  const result = await defaultAISummaryService.getSummary(target, false);

  if (!result.success || !result.data) {
    throw new Error(`Live AI Summary generation failed: ${result.error || result.code}`);
  }

  console.log(`  ✓ Successfully synthesized ${result.data.totalInsights} insights`);
  console.log(`  ✓ Model: ${result.data.modelVersion}`);
  console.log(`  ✓ Generated At: ${result.data.generatedAt}`);
  console.log(`  ✓ Source: ${result.sourceOrigin}`);

  if (result.data.insights.length > 0) {
    const first = result.data.insights[0];
    console.log(`\nSample Insight #1:`);
    console.log(`  Title: ${first.title}`);
    console.log(`  Category: ${first.category}`);
    console.log(`  Classification: ${first.classification}`);
    console.log(`  Confidence: ${first.confidence}`);
    console.log(`  Finding: ${first.finding}`);
    console.log(`  Evidence IDs: ${first.evidenceIds.join(", ")}`);
  }

  console.log("\n========================================");
  console.log("MILESTONE 6 LIVE GEMINI SMOKE TEST PASSED!");
  console.log("========================================\n");
}

runMilestone6SmokeTest().catch((err) => {
  console.error("Milestone 6 live smoke test error:", err);
  process.exit(1);
});
