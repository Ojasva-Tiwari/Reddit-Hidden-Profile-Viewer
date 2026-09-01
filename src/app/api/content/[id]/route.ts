import { NextRequest, NextResponse } from "next/server";
import { ContentService } from "@/server/services/content.service";
import { checkRateLimit } from "@/server/middleware/rate-limiter";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const rateCheck = checkRateLimit(ip, 60);

  if (!rateCheck.success) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests. Please slow down." } },
      { status: 429 }
    );
  }

  const id = params.id;
  if (!id) {
    return NextResponse.json(
      { error: { code: "INVALID_ID", message: "Content ID parameter is required." } },
      { status: 400 }
    );
  }

  const content = await ContentService.getContentById(id);

  if (!content) {
    return NextResponse.json(
      { error: { code: "CONTENT_NOT_FOUND", message: `No archival content record found for ID '${id}'.` } },
      { status: 404 }
    );
  }

  return NextResponse.json({
    data: content,
    meta: {
      source: content.sourceOrigin,
      type: content.type,
    },
  });
}
