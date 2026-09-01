import { PostItem, CommentItem } from "@/types";

export interface CompactEvidenceRecord {
  id: string; // e.g. "t3_1vgbkge" or "t1_p1wosm9"
  type: "POST" | "COMMENT";
  subreddit: string;
  createdAt: string;
  status: string;
  score: number;
  title?: string;
  content: string;
}

export interface DeterministicSignals {
  totalAnalyzed: number;
  postCount: number;
  commentCount: number;
  postsCommentsRatio: number;
  topSubreddits: Array<{ name: string; count: number; percentage: number }>;
  frequentTerms: string[];
  activeYears: number[];
}

/**
 * Preprocessing & deterministic signal extraction from stored user records.
 */
export function extractDeterministicSignals(
  posts: PostItem[],
  comments: CommentItem[]
): DeterministicSignals {
  const postCount = posts.length;
  const commentCount = comments.length;
  const totalAnalyzed = postCount + commentCount;
  const postsCommentsRatio = totalAnalyzed > 0 ? parseFloat((postCount / Math.max(commentCount, 1)).toFixed(2)) : 0;

  // Subreddit frequency
  const subMap = new Map<string, number>();
  for (const p of posts) {
    const s = p.subreddit || p.subredditName || "unknown";
    subMap.set(s, (subMap.get(s) || 0) + 1);
  }
  for (const c of comments) {
    const s = c.subreddit || c.subredditName || "unknown";
    subMap.set(s, (subMap.get(s) || 0) + 1);
  }

  const topSubreddits = Array.from(subMap.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalAnalyzed > 0 ? parseFloat(((count / totalAnalyzed) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Active years
  const yearSet = new Set<number>();
  for (const p of posts) {
    yearSet.add(new Date(p.createdUtc).getFullYear());
  }
  for (const c of comments) {
    yearSet.add(new Date(c.createdUtc).getFullYear());
  }
  const activeYears = Array.from(yearSet).sort((a, b) => a - b);

  // Frequent topic terms (simple deterministic keyword filter, excluding stopwords)
  const stopWords = new Set(["the", "and", "this", "that", "with", "from", "have", "what", "there", "about", "your", "they", "just"]);
  const termMap = new Map<string, number>();

  const processText = (txt: string) => {
    const words = txt.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/);
    for (const w of words) {
      if (w.length >= 4 && !stopWords.has(w)) {
        termMap.set(w, (termMap.get(w) || 0) + 1);
      }
    }
  };

  for (const p of posts) {
    if (p.title) processText(p.title);
    if (p.selftext) processText(p.selftext);
  }
  for (const c of comments) {
    if (c.body) processText(c.body);
  }

  const frequentTerms = Array.from(termMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([term]) => term);

  return {
    totalAnalyzed,
    postCount,
    commentCount,
    postsCommentsRatio,
    topSubreddits,
    frequentTerms,
    activeYears,
  };
}

/**
 * Compacts and selects highest-signal evidence records bounded for Gemini input.
 * Excludes unusable/empty records and caps string lengths.
 */
export function prepareEvidenceSelection(
  posts: PostItem[],
  comments: CommentItem[],
  maxRecords = 60
): CompactEvidenceRecord[] {
  const evidenceList: CompactEvidenceRecord[] = [];

  // Filter & format posts
  for (const p of posts) {
    const text = (p.selftext || "").trim();
    if (text === "[deleted]" || text === "[removed]" || (!text && !p.title)) {
      continue;
    }

    evidenceList.push({
      id: p.redditId,
      type: "POST",
      subreddit: p.subreddit || p.subredditName || "",
      createdAt: p.createdUtc,
      status: p.status,
      score: p.score,
      title: p.title.substring(0, 140),
      content: text ? text.substring(0, 400) : p.title,
    });
  }

  // Filter & format comments
  for (const c of comments) {
    const body = (c.body || "").trim();
    if (body === "[deleted]" || body === "[removed]" || body.length < 15) {
      continue;
    }

    evidenceList.push({
      id: c.redditId,
      type: "COMMENT",
      subreddit: c.subreddit || c.subredditName || "",
      createdAt: c.createdUtc,
      status: c.status,
      score: c.score,
      content: body.substring(0, 400),
    });
  }

  // Sort by score and recency to select highest-signal records
  evidenceList.sort((a, b) => b.score - a.score);

  return evidenceList.slice(0, maxRecords);
}
