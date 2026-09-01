import { defaultProfileService, ProfileService } from "./profile.service";
import { defaultPostService, PostService } from "./post.service";
import { defaultCommentService, CommentService } from "./comment.service";
import { UserRepository } from "@/server/repositories";
import { UserProfile, SyncStatus } from "@/types";

export interface SyncResult {
  success: boolean;
  user?: UserProfile;
  postsSynced: number;
  commentsSynced: number;
  error?: string;
}

export class SyncService {
  private profileService: ProfileService;
  private postService: PostService;
  private commentService: CommentService;

  constructor(
    profileService = defaultProfileService,
    postService = defaultPostService,
    commentService = defaultCommentService
  ) {
    this.profileService = profileService;
    this.postService = postService;
    this.commentService = commentService;
  }

  /**
   * Performs an initial sync: profile info + first batch of posts and comments.
   */
  async syncUser(username: string): Promise<SyncResult> {
    const profileRes = await this.profileService.getProfile(username);
    if (!profileRes.success || !profileRes.user) {
      return {
        success: false,
        postsSynced: 0,
        commentsSynced: 0,
        error: profileRes.error || "Failed to retrieve user profile.",
      };
    }

    const user = profileRes.user;

    // Concurrently fetch posts and comments
    const [postsSync, commentsSync] = await Promise.all([
      this.postService.syncPosts(user.id, user.username, 100),
      this.commentService.syncComments(user.id, user.username, 100),
    ]);

    const hasMore = Boolean(postsSync.nextBefore || commentsSync.nextBefore);
    const finalSyncStatus: SyncStatus = hasMore ? "PARTIAL" : "COMPLETED";

    // Update sync status in DB
    try {
      await UserRepository.updateSyncStatus(user.id, finalSyncStatus, hasMore ? 50 : 100);
    } catch (err: any) {
      console.warn(`[SyncService] Could not update sync status in DB: ${err.message}`);
    }

    return {
      success: true,
      user: {
        ...user,
        syncStatus: finalSyncStatus,
        syncProgressPercent: hasMore ? 50 : 100,
        syncProgress: hasMore ? 50 : 100,
        lastSyncedAt: new Date().toISOString(),
      },
      postsSynced: postsSync.count,
      commentsSynced: commentsSync.count,
    };
  }
}

export const defaultSyncService = new SyncService();
