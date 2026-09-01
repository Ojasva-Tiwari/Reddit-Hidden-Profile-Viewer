import {
  RedditUser,
  RedditPost,
  RedditComment,
  SearchQueryOptions,
  PaginatedResult,
} from "./types";

/**
 * Pluggable Reddit historical data source interface.
 * Decouples upstream providers (Arctic Shift, Pushshift dumps, future providers) from application logic.
 */
export interface IRedditDataSource {
  readonly providerName: string;

  /**
   * Look up user profile and metadata summary.
   */
  getUserProfile(username: string): Promise<RedditUser | null>;

  /**
   * Search and retrieve submissions by author.
   */
  getPosts(options: SearchQueryOptions): Promise<PaginatedResult<RedditPost>>;

  /**
   * Search and retrieve comments by author.
   */
  getComments(options: SearchQueryOptions): Promise<PaginatedResult<RedditComment>>;

  /**
   * Check provider connectivity.
   */
  healthCheck(): Promise<boolean>;
}
