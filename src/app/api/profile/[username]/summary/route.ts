import { NextRequest, NextResponse } from "next/server";
import { defaultAISummaryService } from "@/server/services/ai-summary.service";
import { usernameParamSchema } from "@/server/schemas/api.schemas";
import { checkRateLimit } from "@/server/middleware/rate-limiter";

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const rateLimitMax = parseInt(process.env.AI_SUMMARY_RATE_LIMIT_PER_MINUTE || "10", 10);
  const rateCheck = checkRateLimit(`ai_summary_${ip}`, rateLimitMax);

  if (!rateCheck.success) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "AI Summary generation rate limit exceeded. Please wait a moment before trying again.",
        },
      },
      { status: 429 }
    );
  }

  const userParse = usernameParamSchema.safeParse(params.username);
  if (!userParse.success) {
    return NextResponse.json(
      { error: { code: "INVALID_USERNAME", message: userParse.error.errors[0].message } },
      { status: 400 }
    );
  }

  const result = await defaultAISummaryService.getSummary(userParse.data, false);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        error: {
          code: result.code || "AI_SUMMARY_FAILED",
          message: result.error || "Could not generate profile summary.",
        },
      },
      { status: result.code === "INSUFFICIENT_DATA" ? 422 : 503 }
    );
  }

  return NextResponse.json({
    data: result.data,
    meta: {
      source: result.sourceOrigin,
      cached: result.sourceOrigin === "DATABASE_CACHE",
      totalInsights: result.data.totalInsights,
      modelVersion: result.data.modelVersion,
    },
  });
}
