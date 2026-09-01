import { IRedditDataSource } from "@/lib/datasource/reddit-data-source";
import { defaultArcticShiftSource } from "@/lib/datasource/arctic-shift-source";
import { UserRepository } from "@/server/repositories";
import { UserProfile, SyncStatus } from "@/types";

export interface ProfileServiceResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
  statusCode: number;
  source: "DATABASE" | "UPSTREAM" | "NOT_FOUND";
}

/**
 * Validates Reddit username format according to Reddit platform rules.
 */
export function isValidUsername(username: string): boolean {
  if (!username) return false;
  const clean = username.trim().replace(/^u\//i, "");
  // Reddit usernames: 3-30 characters, alphanumeric, underscores, and dashes
  return /^[A-Za-z0-9_-]{3,30}$/.test(clean);
}

export class ProfileService {
  private dataSource: IRedditDataSource;

  constructor(dataSource: IRedditDataSource = defaultArcticShiftSource) {
    this.dataSource = dataSource;
  }

  /**
   * Retrieves user profile by checking local database cache first,
   * falling back to the upstream data source if not cached.
   */
  async getProfile(username: string): Promise<ProfileServiceResult> {
    const cleanUsername = username.trim().replace(/^u\//i, "");

    if (!isValidUsername(cleanUsername)) {
      return {
        success: false,
        error: "Invalid username format. Reddit usernames must be 3-30 characters with alphanumeric characters, underscores, or hyphens.",
        statusCode: 400,
        source: "NOT_FOUND",
      };
    }

    // 1. Check local PostgreSQL database first
    try {
      const cached = await UserRepository.findByUsername(cleanUsername);
      if (cached) {
        return {
          success: true,
          user: {
            id: cached.id,
            redditId: cached.redditId || undefined,
            username: cached.username,
            avatarUrl: cached.avatarUrl,
            createdUtc: cached.createdUtc ? cached.createdUtc.toISOString() : new Date().toISOString(),
            firstSeenUtc: cached.firstSeenUtc ? cached.firstSeenUtc.toISOString() : undefined,
            lastSeenUtc: cached.lastSeenUtc ? cached.lastSeenUtc.toISOString() : undefined,
            totalKarma: cached.totalKarma,
            linkKarma: cached.linkKarma,
            commentKarma: cached.commentKarma,
            isSuspended: cached.isSuspended,
            isDeleted: cached.isDeleted,
            syncStatus: cached.syncStatus as SyncStatus,
            syncProgressPercent: cached.syncProgressPercent,
            syncProgress: cached.syncProgressPercent,
            lastSyncedAt: cached.lastSyncedAt ? cached.lastSyncedAt.toISOString() : undefined,
          },
          statusCode: 200,
          source: "DATABASE",
        };
      }
    } catch (dbErr: any) {
      console.warn(`[ProfileService] Database lookup unavailable: ${dbErr.message}. Proceeding to upstream.`);
    }

    // 2. Query Upstream Data Source (Arctic Shift)
    try {
      const upstreamUser = await this.dataSource.getUserProfile(cleanUsername);

      if (!upstreamUser) {
        return {
          success: false,
          error: `No historical archive records found for user 'u/${cleanUsername}'.`,
          statusCode: 404,
          source: "NOT_FOUND",
        };
      }

      // 3. Attempt persisting to local database
      let dbId = `u_${cleanUsername}`;
      try {
        const saved = await UserRepository.upsertUser({
          redditId: upstreamUser.redditId,
          username: upstreamUser.username,
          avatarUrl: upstreamUser.avatarUrl,
          createdUtc: upstreamUser.createdUtc,
          firstSeenUtc: upstreamUser.firstSeenUtc,
          lastSeenUtc: upstreamUser.lastSeenUtc,
          totalKarma: upstreamUser.totalKarma,
          linkKarma: upstreamUser.linkKarma,
          commentKarma: upstreamUser.commentKarma,
          isSuspended: upstreamUser.isSuspended,
          isDeleted: upstreamUser.isDeleted,
          syncStatus: "PENDING",
          syncProgressPercent: 0,
        });
        if (saved) dbId = saved.id;
      } catch (persistErr: any) {
        console.warn(`[ProfileService] Could not persist user to DB: ${persistErr.message}`);
      }

      return {
        success: true,
        user: {
          id: dbId,
          redditId: upstreamUser.redditId,
          username: upstreamUser.username,
          avatarUrl: upstreamUser.avatarUrl,
          createdUtc: upstreamUser.createdUtc ? upstreamUser.createdUtc.toISOString() : new Date().toISOString(),
          firstSeenUtc: upstreamUser.firstSeenUtc ? upstreamUser.firstSeenUtc.toISOString() : undefined,
          lastSeenUtc: upstreamUser.lastSeenUtc ? upstreamUser.lastSeenUtc.toISOString() : undefined,
          totalKarma: upstreamUser.totalKarma,
          linkKarma: upstreamUser.linkKarma,
          commentKarma: upstreamUser.commentKarma,
          isSuspended: upstreamUser.isSuspended,
          isDeleted: upstreamUser.isDeleted,
          syncStatus: "PENDING",
          syncProgressPercent: 0,
          syncProgress: 0,
        },
        statusCode: 200,
        source: "UPSTREAM",
      };
    } catch (upstreamErr: any) {
      console.error(`[ProfileService] Upstream error:`, upstreamErr.message);
      return {
        success: false,
        error: `Failed to query historical data source: ${upstreamErr.message}`,
        statusCode: 502,
        source: "NOT_FOUND",
      };
    }
  }
}

export const defaultProfileService = new ProfileService();
