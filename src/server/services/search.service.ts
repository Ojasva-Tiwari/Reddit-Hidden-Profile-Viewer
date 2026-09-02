import { IRedditDataSource } from "@/lib/datasource/reddit-data-source";
import { defaultArcticShiftSource } from "@/lib/datasource/arctic-shift-source";
import { UserRepository } from "@/server/repositories";
import { isValidUsername } from "./profile.service";

export interface SearchUserResult {
  username: string;
  redditId?: string;
  avatarUrl?: string | null;
  totalKarma?: number | null;
  syncStatus: string;
  historicalRecordsFound: boolean;
  lastSyncedAt?: string;
  source: "DATABASE" | "UPSTREAM" | "NOT_FOUND";
}

export class SearchService {
  private dataSource: IRedditDataSource;

  constructor(dataSource: IRedditDataSource = defaultArcticShiftSource) {
    this.dataSource = dataSource;
  }

  async searchUser(username: string): Promise<SearchUserResult | null> {
    const clean = username.trim().replace(/^u\//i, "");
    if (!isValidUsername(clean)) return null;

    // 1. Check local DB first
    try {
      const cached = await UserRepository.findByUsername(clean);
      if (cached) {
        return {
          username: cached.username,
          redditId: cached.redditId || undefined,
          avatarUrl: cached.avatarUrl,
          totalKarma: cached.totalKarma,
          syncStatus: cached.syncStatus,
          historicalRecordsFound: true,
          lastSyncedAt: cached.lastSyncedAt ? cached.lastSyncedAt.toISOString() : undefined,
          source: "DATABASE",
        };
      }
    } catch (err: any) {
      console.warn(`[SearchService] Local DB search failed: ${err.message}`);
    }

    // 2. Query Upstream
    try {
      const upstream = await this.dataSource.getUserProfile(clean);
      if (!upstream) return null;

      return {
        username: upstream.username,
        redditId: upstream.redditId,
        avatarUrl: upstream.avatarUrl,
        totalKarma: upstream.totalKarma,
        syncStatus: "PENDING",
        historicalRecordsFound: true,
        source: "UPSTREAM",
      };
    } catch (err: any) {
      console.error(`[SearchService] Upstream search error: ${err.message}`);
      return null;
    }
  }
}

export const defaultSearchService = new SearchService();
