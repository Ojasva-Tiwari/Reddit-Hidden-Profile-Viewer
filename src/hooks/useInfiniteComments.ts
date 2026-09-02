"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { CommentItem } from "@/types";

export interface UseInfiniteCommentsOptions {
  username: string;
  statusFilter?: string;
  sortOption?: string;
  searchQuery?: string;
  subreddit?: string;
  from?: number;
  to?: number;
  limit?: number;
  enabled?: boolean;
}

interface CommentsApiResponse {
  data: CommentItem[];
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

export function useInfiniteComments({
  username,
  statusFilter = "ALL",
  sortOption = "newest",
  searchQuery = "",
  subreddit,
  from,
  to,
  limit = 50,
  enabled = true,
}: UseInfiniteCommentsOptions) {
  const cleanUsername = username.trim().replace(/^u\//i, "");

  const queryKey = [
    "comments",
    cleanUsername,
    {
      status: statusFilter,
      sort: sortOption,
      search: searchQuery.trim(),
      subreddit: subreddit || "",
      from: from || "",
      to: to || "",
      limit,
    },
  ];

  const infiniteQuery = useInfiniteQuery<CommentsApiResponse, Error>({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const url = new URL(`/api/profile/${encodeURIComponent(cleanUsername)}/comments`, window.location.origin);
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
      if (pageParam !== undefined && pageParam !== null) {
        url.searchParams.set("cursor", String(pageParam));
      }

      const res = await fetch(url.toString());
      const json: CommentsApiResponse = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error?.message || "Failed to load comments from archive.");
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

  // Flatten and strictly deduplicate comments across all loaded pages by redditId
  const { comments, totalUnique } = useMemo(() => {
    if (!infiniteQuery.data?.pages) {
      return { comments: [] as CommentItem[], totalUnique: 0 };
    }

    const seenIds = new Set<string>();
    const uniqueComments: CommentItem[] = [];

    for (const page of infiniteQuery.data.pages) {
      if (!page.data) continue;
      for (const item of page.data) {
        const idKey = item.redditId || item.id;
        if (idKey && !seenIds.has(idKey)) {
          seenIds.add(idKey);
          uniqueComments.push(item);
        }
      }
    }

    return { comments: uniqueComments, totalUnique: uniqueComments.length };
  }, [infiniteQuery.data?.pages]);

  return {
    ...infiniteQuery,
    comments,
    totalUnique,
    isEmpty: !infiniteQuery.isLoading && comments.length === 0,
  };
}
