import { PostRepository, CommentRepository } from "@/server/repositories";
import { defaultArcticShiftSource } from "@/lib/datasource/arctic-shift-source";
import { ContentStatus, MediaStatus } from "@/types";

export interface ContentDetailResult {
  id: string;
  redditId: string;
  type: "POST" | "COMMENT";
  title?: string;
  body: string;
  author: string;
  subreddit: string;
  permalink: string;
  score: number;
  numComments?: number;
  createdUtc: string;
  editedUtc?: string | null;
  status: ContentStatus;
  mediaStatus?: MediaStatus;
  mediaUrl?: string;
  isNsfw?: boolean;
  parentContext?: {
    parentId: string;
    postRedditId?: string;
  };
  provenanceHistory: Array<{
    version: number;
    recordedAt: string;
    status: ContentStatus;
    content: string;
    diffPatch?: string;
  }>;
  sourceOrigin: string;
}

export class ContentService {
  /**
   * Resolves content detail for a post or comment by its Reddit ID.
   */
  static async getContentById(id: string): Promise<ContentDetailResult | null> {
    const cleanId = id.trim();
    const isComment = cleanId.startsWith("t1_");
    const isPost = cleanId.startsWith("t3_");

    // 1. Try resolving from local database
    try {
      if (isPost || !isComment) {
        const post = await PostRepository.findByRedditId(cleanId.startsWith("t3_") ? cleanId : `t3_${cleanId}`);
        if (post) {
          return {
            id: post.redditId,
            redditId: post.redditId,
            type: "POST",
            title: post.title,
            body: post.selftext,
            author: post.authorUsername,
            subreddit: post.subredditName,
            permalink: post.permalink,
            score: post.score,
            numComments: post.numComments,
            createdUtc: post.createdUtc.toISOString(),
            editedUtc: post.editedUtc ? post.editedUtc.toISOString() : undefined,
            status: post.status as ContentStatus,
            mediaStatus: post.mediaStatus,
            mediaUrl: post.url || undefined,
            isNsfw: post.isNsfw,
            provenanceHistory: [
              {
                version: 1,
                recordedAt: post.createdUtc.toISOString(),
                status: "VISIBLE",
                content: post.selftext,
              },
            ],
            sourceOrigin: "DATABASE",
          };
        }
      }

      if (isComment || !isPost) {
        const comment = await CommentRepository.findByRedditId(cleanId.startsWith("t1_") ? cleanId : `t1_${cleanId}`);
        if (comment) {
          return {
            id: comment.redditId,
            redditId: comment.redditId,
            type: "COMMENT",
            body: comment.body,
            author: comment.authorUsername,
            subreddit: comment.subredditName,
            permalink: comment.permalink || "",
            score: comment.score,
            createdUtc: comment.createdUtc.toISOString(),
            editedUtc: comment.editedUtc ? comment.editedUtc.toISOString() : undefined,
            status: comment.status as ContentStatus,
            isNsfw: comment.isNsfw,
            parentContext: {
              parentId: comment.parentId,
              postRedditId: comment.postRedditId,
            },
            provenanceHistory: [
              {
                version: 1,
                recordedAt: comment.createdUtc.toISOString(),
                status: "VISIBLE",
                content: comment.body,
              },
            ],
            sourceOrigin: "DATABASE",
          };
        }
      }
    } catch (err: any) {
      console.warn(`[ContentService] Local DB content lookup failed: ${err.message}`);
    }

    return null;
  }
}
