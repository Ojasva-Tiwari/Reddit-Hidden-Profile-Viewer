"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { PostItem } from "@/types";

export interface UseInfinitePostsOptions {
  username: string;
  statusFilter?: string;
  sortOption?: string;
  searchQuery?: string;
  subreddit?: string;
  from?: number;
  to?: number;
  hasMedia?: string;
  limit?: number;
  enabled?: boolean;
}

interface PostsApiResponse {
  data: PostItem[];
  meta: {
    pagination: {
      limit: number;
      total: number;
      hasMore: boolean;
      nextCursor?: string | number;
      nextBefore?: number;
      nextAfter?: number;
    };
    source: "DATABASE" | "UPSTREAM";
    cached: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

export function useInfinitePosts({
  username,
  statusFilter = "ALL",
  sortOption = "newest",
  searchQuery = "",
  subreddit,
  from,
  to,
  hasMedia = "all",
  limit = 50,
  enabled = true,
}: UseInfinitePostsOptions) {
  const cleanUsername = username.trim().replace(/^u\//i, "");

  const queryKey = [
    "posts",
    cleanUsername,
    {
      status: statusFilter,
      sort: sortOption,
      search: searchQuery.trim(),
      subreddit: subreddit || "",
      from: from || "",
      to: to || "",
      hasMedia,
      limit,
    },
  ];

  const infiniteQuery = useInfiniteQuery<PostsApiResponse, Error>({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const url = new URL(`/api/profile/${encodeURIComponent(cleanUsername)}/posts`, window.location.origin);
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("sort", sortOption);
      if (statusFilter && statusFilter !== "ALL") {
        url.searchParams.set("status", statusFilter);
      }
      if (searchQuery.trim()) {
        url.searchParams.set("search", searchQuery.trim());
      }
      if (subreddit) {
        url.searchParams.set("subreddit", subreddit);
      }
      if (from) {
        url.searchParams.set("from", String(from));
      }
      if (to) {
        url.searchParams.set("to", String(to));
      }
      if (hasMedia && hasMedia !== "all") {
        url.searchParams.set("hasMedia", hasMedia);
      }
      if (pageParam !== undefined && pageParam !== null) {
        url.searchParams.set("cursor", String(pageParam));
      }

      const res = await fetch(url.toString());
      const json: PostsApiResponse = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error?.message || "Failed to load posts from archive.");
      }

      return json;
    },
    initialPageParam: undefined as string | number | undefined,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.meta?.pagination;
      if (!pagination || !pagination.hasMore) {
        return undefined;
      }
      return pagination.nextCursor !== undefined ? pagination.nextCursor : undefined;
    },
    enabled: Boolean(cleanUsername) && enabled,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Flatten and strictly deduplicate posts across all loaded pages by redditId
  const { posts, totalUnique } = useMemo(() => {
    if (!infiniteQuery.data?.pages) {
      return { posts: [] as PostItem[], totalUnique: 0 };
    }

    const seenIds = new Set<string>();
    const uniquePosts: PostItem[] = [];

    for (const page of infiniteQuery.data.pages) {
      if (!page.data) continue;
      for (const item of page.data) {
        const idKey = item.redditId || item.id;
        if (idKey && !seenIds.has(idKey)) {
          seenIds.add(idKey);
          uniquePosts.push(item);
        }
      }
    }

    return { posts: uniquePosts, totalUnique: uniquePosts.length };
  }, [infiniteQuery.data?.pages]);

  return {
    ...infiniteQuery,
    posts,
    totalUnique,
    isEmpty: !infiniteQuery.isLoading && posts.length === 0,
  };
}
