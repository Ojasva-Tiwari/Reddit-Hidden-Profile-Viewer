import { NextRequest, NextResponse } from "next/server";
import { defaultAISummaryService } from "@/server/services/ai-summary.service";
import { usernameParamSchema } from "@/server/schemas/api.schemas";
import { checkRateLimit } from "@/server/middleware/rate-limiter";

function mapErrorToStatusCode(code?: string): number {
  switch (code) {
    case "INSUFFICIENT_DATA":
      return 422;
    case "RATE_LIMITED":
      return 429;
    case "AI_TIMEOUT":
      return 504;
    case "INPUT_TOO_LARGE":
      return 413;
    case "AI_PROVIDER_ERROR":
    case "MALFORMED_OUTPUT":
    case "SCHEMA_VALIDATION_FAILED":
    case "VALIDATION_FAILED":
      return 502;
    case "AI_UNAVAILABLE":
    default:
      return 503;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const rawIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous";
  const ip = rawIp.split(",")[0].trim();

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
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil(rateCheck.resetMs / 1000).toString(),
        },
      }
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
    const statusCode = mapErrorToStatusCode(result.code);
    return NextResponse.json(
      {
        error: {
          code: result.code || "AI_REFRESH_FAILED",
          message: result.error || "Could not re-synthesize profile summary.",
        },
      },
      { status: statusCode }
    );
  }

  return NextResponse.json(
    {
      data: result.data,
      meta: {
        source: result.sourceOrigin,
        cached: false,
        totalInsights: result.data.totalInsights,
        modelVersion: result.data.modelVersion,
      },
    },
    {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    }
  );
}
