import { NextRequest, NextResponse } from "next/server";
import { defaultActivityService } from "@/server/services/activity.service";
import { usernameParamSchema } from "@/server/schemas/api.schemas";
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

  const activity = await defaultActivityService.getActivityDistribution(userParse.data);

  return NextResponse.json({
    data: activity,
    meta: {
      source: "ARCTIC_SHIFT",
      calculatedAt: new Date().toISOString(),
    },
  });
}
