import { NextRequest, NextResponse } from "next/server";
import { defaultAISummaryService } from "@/server/services/ai-summary.service";
import { usernameParamSchema } from "@/server/schemas/api.schemas";
import { checkRateLimit } from "@/server/middleware/rate-limiter";

export async function POST(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const rateLimitMax = parseInt(process.env.AI_SUMMARY_REFRESH_RATE_LIMIT_PER_MINUTE || "5", 10);
  const rateCheck = checkRateLimit(`ai_refresh_${ip}`, rateLimitMax);

  if (!rateCheck.success) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "AI Summary refresh rate limit reached. Please wait before re-synthesizing.",
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

  const result = await defaultAISummaryService.getSummary(userParse.data, true);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        error: {
          code: result.code || "AI_REFRESH_FAILED",
          message: result.error || "Could not re-synthesize profile summary.",
        },
      },
      { status: result.code === "INSUFFICIENT_DATA" ? 422 : 503 }
    );
  }

  return NextResponse.json({
    data: result.data,
    meta: {
      source: result.sourceOrigin,
      cached: false,
      totalInsights: result.data.totalInsights,
      modelVersion: result.data.modelVersion,
    },
  });
}
