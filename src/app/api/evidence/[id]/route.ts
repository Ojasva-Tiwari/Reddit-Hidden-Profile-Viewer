import { NextRequest, NextResponse } from "next/server";
import { EvidenceRepository } from "@/server/repositories";
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
      { error: { code: "INVALID_ID", message: "Evidence ID parameter is required." } },
      { status: 400 }
    );
  }

  try {
    const evidence = await EvidenceRepository.findByRedditFullname(id);
    if (!evidence || evidence.length === 0) {
      return NextResponse.json(
        { error: { code: "EVIDENCE_NOT_FOUND", message: `No evidence links found for target '${id}'.` } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: evidence,
      meta: {
        total: evidence.length,
        source: "DATABASE",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: "QUERY_FAILED", message: err.message } },
      { status: 500 }
    );
  }
}
