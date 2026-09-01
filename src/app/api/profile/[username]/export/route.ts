import { NextRequest, NextResponse } from "next/server";
import { defaultPostService } from "@/server/services/post.service";
import { defaultCommentService } from "@/server/services/comment.service";
import { usernameParamSchema } from "@/server/schemas/api.schemas";
import { checkRateLimit } from "@/server/middleware/rate-limiter";

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const rateCheck = checkRateLimit(ip, 30); // 30 exports per minute max

  if (!rateCheck.success) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many export requests. Please slow down." } },
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
  const format = searchParams.get("format") === "csv" ? "csv" : "json";
  const type = searchParams.get("type") || "all";

  const username = userParse.data;

  // Fetch posts and comments
  const [postsRes, commentsRes] = await Promise.all([
    type === "comments" ? Promise.resolve({ posts: [] }) : defaultPostService.queryPosts(username, { limit: 100 }),
    type === "posts" ? Promise.resolve({ comments: [] }) : defaultCommentService.queryComments(username, { limit: 100 }),
  ]);

  const records = [
    ...postsRes.posts.map((p) => ({
      redditId: p.redditId,
      type: "POST",
      createdUtc: p.createdUtc,
      editedUtc: p.editedUtc || null,
      author: p.author || p.authorUsername,
      subreddit: p.subreddit || p.subredditName,
      title: p.title,
      content: p.selftext,
      status: p.status,
      mediaStatus: p.mediaStatus,
      score: p.score,
      numComments: p.numComments,
      permalink: `https://reddit.com${p.permalink}`,
      sourceOrigin: "ARCTIC_SHIFT",
    })),
    ...commentsRes.comments.map((c) => ({
      redditId: c.redditId,
      type: "COMMENT",
      createdUtc: c.createdUtc,
      editedUtc: c.editedUtc || null,
      author: c.author || c.authorUsername,
      subreddit: c.subreddit || c.subredditName,
      title: "",
      content: c.body,
      status: c.status,
      mediaStatus: "MEDIA_UNAVAILABLE",
      score: c.score,
      numComments: 0,
      permalink: c.permalink ? `https://reddit.com${c.permalink}` : "",
      sourceOrigin: "ARCTIC_SHIFT",
    })),
  ];

  if (format === "csv") {
    const headers = [
      "redditId",
      "type",
      "createdUtc",
      "author",
      "subreddit",
      "title",
      "content",
      "status",
      "mediaStatus",
      "score",
      "numComments",
      "permalink",
      "sourceOrigin",
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const val = String(str).replace(/"/g, '""');
      return `"${val}"`;
    };

    const csvRows = [
      headers.join(","),
      ...records.map((r: any) => headers.map((h) => escapeCsv(r[h])).join(",")),
    ];

    const csvContent = csvRows.join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="reddit_archive_${username}_${Date.now()}.csv"`,
      },
    });
  }

  // Default JSON format
  return NextResponse.json({
    data: records,
    meta: {
      username,
      totalRecords: records.length,
      exportedAt: new Date().toISOString(),
      source: "ARCTIC_SHIFT",
    },
  });
}
