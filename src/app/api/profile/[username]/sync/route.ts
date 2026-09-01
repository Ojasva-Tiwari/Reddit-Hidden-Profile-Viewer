import { NextRequest, NextResponse } from "next/server";
import { defaultSyncService } from "@/server/services/sync.service";

export async function POST(
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

  const result = await defaultSyncService.syncUser(username);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    user: result.user,
    postsSynced: result.postsSynced,
    commentsSynced: result.commentsSynced,
  });
}
