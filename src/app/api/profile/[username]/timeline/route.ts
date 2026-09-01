import { NextRequest, NextResponse } from "next/server";
import { defaultTimelineService } from "@/server/services/timeline.service";
import { usernameParamSchema, timelineQuerySchema } from "@/server/schemas/api.schemas";
import { checkRateLimit } from "@/server/middleware/rate-limiter";

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const rateCheck = checkRateLimit(ip, 60);

  if (!rateCheck.success) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests. Please slow down." } },
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

  const { searchParams } = new URL(request.url);
  const queryObj = {
    limit: searchParams.get("limit") || undefined,
    sort: searchParams.get("sort") || undefined,
    type: searchParams.get("type") || undefined,
    status: searchParams.get("status") || undefined,
    subreddit: searchParams.get("subreddit") || undefined,
    year: searchParams.get("year") || undefined,
  };

  const queryParse = timelineQuerySchema.safeParse(queryObj);
  if (!queryParse.success) {
    return NextResponse.json(
      { error: { code: "INVALID_PARAMETERS", message: queryParse.error.errors[0].message } },
      { status: 400 }
    );
  }

  const events = await defaultTimelineService.getTimeline(userParse.data, queryParse.data);

  return NextResponse.json({
    data: events,
    meta: {
      total: events.length,
      source: "ARCTIC_SHIFT",
    },
  });
}
