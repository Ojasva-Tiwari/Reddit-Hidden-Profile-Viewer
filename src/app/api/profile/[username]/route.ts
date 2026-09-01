import { NextRequest, NextResponse } from "next/server";
import { defaultProfileService } from "@/server/services/profile.service";

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const username = params.username;

  if (!username) {
    return NextResponse.json(
      { error: "Username parameter is required." },
      { status: 400 }
    );
  }

  const result = await defaultProfileService.getProfile(username);

  if (!result.success) {
    return NextResponse.json(
      {
        error: result.error,
        statusCode: result.statusCode,
        source: result.source,
      },
      { status: result.statusCode }
    );
  }

  return NextResponse.json({
    success: true,
    user: result.user,
    source: result.source,
  });
}
