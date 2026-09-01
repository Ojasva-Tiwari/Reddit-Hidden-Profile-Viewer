import { NextRequest, NextResponse } from "next/server";
import { defaultPostService } from "@/server/services/post.service";
import { usernameParamSchema, postsQuerySchema } from "@/server/schemas/api.schemas";
import { checkRateLimit } from "@/server/middleware/rate-limiter";

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const rateCheck = checkRateLimit(ip, 60);

  if (!rateCheck.success) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests. Please try again shortly." } },
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
    page: searchParams.get("page") || undefined,
    sort: searchParams.get("sort") || undefined,
    status: searchParams.get("status") || undefined,
    subreddit: searchParams.get("subreddit") || undefined,
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
    search: searchParams.get("search") || undefined,
    hasMedia: searchParams.get("hasMedia") || undefined,
  };

  const queryParse = postsQuerySchema.safeParse(queryObj);
  if (!queryParse.success) {
    return NextResponse.json(
      { error: { code: "INVALID_PARAMETERS", message: queryParse.error.errors[0].message } },
      { status: 400 }
    );
  }

  const result = await defaultPostService.queryPosts(userParse.data, queryParse.data);

  return NextResponse.json({
    data: result.posts,
    meta: {
      pagination: result.pagination,
      source: result.source,
      cached: result.source === "DATABASE",
    },
  });
}
