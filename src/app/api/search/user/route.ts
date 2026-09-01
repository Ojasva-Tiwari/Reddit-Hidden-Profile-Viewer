import { NextRequest, NextResponse } from "next/server";
import { defaultSearchService } from "@/server/services/search.service";
import { searchUserQuerySchema } from "@/server/schemas/api.schemas";
import { checkRateLimit } from "@/server/middleware/rate-limiter";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const rateCheck = checkRateLimit(ip, 60);

  if (!rateCheck.success) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  const parseResult = searchUserQuerySchema.safeParse({ username });
  if (!parseResult.success) {
    return NextResponse.json(
      { error: { code: "INVALID_PARAMETERS", message: parseResult.error.errors[0].message } },
      { status: 400 }
    );
  }

  const result = await defaultSearchService.searchUser(parseResult.data.username);

  if (!result) {
    return NextResponse.json(
      { error: { code: "USER_NOT_FOUND", message: `User 'u/${parseResult.data.username}' not found in archive.` } },
      { status: 404 }
    );
  }

  return NextResponse.json({
    data: result,
    meta: {
      source: result.source,
      cached: result.source === "DATABASE",
      syncStatus: result.syncStatus,
    },
  });
}
