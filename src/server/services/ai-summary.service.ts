import { defaultGeminiClient, GeminiClient } from "@/lib/ai/gemini";
import { defaultPostService, PostService } from "./post.service";
import { defaultCommentService, CommentService } from "./comment.service";
import { UserRepository, AIRepository, AIInsightSelect } from "@/server/repositories";
import { extractDeterministicSignals, prepareEvidenceSelection, CompactEvidenceRecord } from "@/lib/ai/evidence";
import { ProfileSummaryOutput, InsightItem } from "@/lib/ai/schemas";

export interface AISummaryResult {
  success: boolean;
  code?: string;
  error?: string;
  data?: ProfileSummaryOutput;
  sourceOrigin: "DATABASE_CACHE" | "GEMINI_GENERATION";
  evidenceMap?: Record<string, CompactEvidenceRecord>;
}

export class AISummaryService {
  private geminiClient: GeminiClient;
  private postService: PostService;
  private commentService: CommentService;

  constructor(
    geminiClient: GeminiClient = defaultGeminiClient,
    postService: PostService = defaultPostService,
    commentService: CommentService = defaultCommentService
  ) {
    this.geminiClient = geminiClient;
    this.postService = postService;
    this.commentService = commentService;
  }

  /**
   * Retrieves or generates a 30 Things AI summary for a user.
   */
  async getSummary(username: string, forceRefresh = false): Promise<AISummaryResult> {
    const clean = username.trim().replace(/^u\//i, "");

    // 1. Check local DB cache if forceRefresh is false
    if (!forceRefresh) {
      try {
        const user = await UserRepository.findByUsername(clean);
        if (user) {
          const dbInsights: AIInsightSelect[] = await AIRepository.findByUserId(user.id);
          if (dbInsights && dbInsights.length > 0) {
            const mappedInsights: InsightItem[] = dbInsights.map((ins, idx) => ({
              id: ins.id,
              number: ins.insightIndex || idx + 1,
              category: ins.category as any,
              title: ins.title,
              finding: ins.finding,
              classification: ins.classification as any,
              confidence: ins.confidence as any,
              evidenceIds: [user.username],
            }));

            return {
              success: true,
              sourceOrigin: "DATABASE_CACHE",
              data: {
                username: clean,
                totalInsights: mappedInsights.length,
                generatedAt: dbInsights[0].generatedAt.toISOString(),
                modelVersion: dbInsights[0].modelVersion,
                schemaVersion: "1",
                insights: mappedInsights,
              },
            };
          }
        }
      } catch (err: any) {
        console.warn(`[AISummaryService] Local cache lookup failed: ${err.message}`);
      }
    }

    // 2. Fetch candidate posts and comments
    const [postsRes, commentsRes] = await Promise.all([
      this.postService.queryPosts(clean, { limit: 100 }),
      this.commentService.queryComments(clean, { limit: 100 }),
    ]);

    const posts = postsRes.posts;
    const comments = commentsRes.comments;

    if (posts.length === 0 && comments.length === 0) {
      return {
        success: false,
        code: "INSUFFICIENT_DATA",
        error: "The archive does not contain enough evidence to generate reliable AI insights.",
        sourceOrigin: "GEMINI_GENERATION",
      };
    }

    // 3. Preprocess signals & prepare compact evidence
    const signals = extractDeterministicSignals(posts, comments);
    const evidenceSelection = prepareEvidenceSelection(posts, comments, 60);

    if (evidenceSelection.length < 3) {
      return {
        success: false,
        code: "INSUFFICIENT_DATA",
        error: `Only ${evidenceSelection.length} valid historical records found. Insufficient evidence for reliable behavioral profiling.`,
        sourceOrigin: "GEMINI_GENERATION",
      };
    }

    // Build evidence lookup map
    const evidenceMap: Record<string, CompactEvidenceRecord> = {};
    for (const ev of evidenceSelection) {
      evidenceMap[ev.id] = ev;
    }

    // 4. Generate with Gemini
    const geminiRes = await this.geminiClient.generateProfileSummary(clean, signals, evidenceSelection);

    if (!geminiRes.success || !geminiRes.data) {
      return {
        success: false,
        code: geminiRes.code || "AI_UNAVAILABLE",
        error: geminiRes.error || "Could not synthesize profile insights with AI.",
        sourceOrigin: "GEMINI_GENERATION",
      };
    }

    // 5. Audit & Validate Evidence IDs
    const rawInsights = geminiRes.data.insights || [];
    const validatedInsights: InsightItem[] = [];
    const seenTitles = new Set<string>();

    for (const insight of rawInsights) {
      // Must have at least 1 valid evidence ID from candidate set
      const validIds = insight.evidenceIds.filter((id) => Boolean(evidenceMap[id]));
      if (validIds.length === 0) {
        console.warn(`[AISummaryService] Dropping ungrounded insight '${insight.title}' (Invalid evidence IDs: ${insight.evidenceIds.join(", ")})`);
        continue;
      }

      // Deduplicate similar titles
      const normalizedTitle = insight.title.toLowerCase().trim();
      if (seenTitles.has(normalizedTitle)) {
        continue;
      }
      seenTitles.add(normalizedTitle);

      validatedInsights.push({
        ...insight,
        number: validatedInsights.length + 1,
        evidenceIds: validIds,
      });
    }

    if (validatedInsights.length === 0) {
      return {
        success: false,
        code: "VALIDATION_FAILED",
        error: "None of the synthesized insights could be grounded in authentic stored evidence records.",
        sourceOrigin: "GEMINI_GENERATION",
      };
    }

    const finalOutput: ProfileSummaryOutput = {
      username: clean,
      totalInsights: validatedInsights.length,
      generatedAt: new Date().toISOString(),
      modelVersion: this.geminiClient.getModelName(),
      schemaVersion: "1",
      insights: validatedInsights,
    };

    // 6. Persist to Database if user exists
    try {
      const user = await UserRepository.findByUsername(clean);
      if (user) {
        const insightsToInsert = validatedInsights.map((ins) => ({
          userId: user.id,
          insightIndex: ins.number,
          category: ins.category,
          title: ins.title,
          finding: ins.finding,
          classification: ins.classification,
          confidence: ins.confidence,
          reasoning: `Synthesized from citations: ${ins.evidenceIds.join(", ")}`,
          modelVersion: finalOutput.modelVersion,
        }));

        await AIRepository.insertInsightsBatch(insightsToInsert);
      }
    } catch (dbErr: any) {
      console.warn(`[AISummaryService] Could not persist AI summary to DB: ${dbErr.message}`);
    }

    return {
      success: true,
      data: finalOutput,
      sourceOrigin: "GEMINI_GENERATION",
      evidenceMap,
    };
  }
}

export const defaultAISummaryService = new AISummaryService();
