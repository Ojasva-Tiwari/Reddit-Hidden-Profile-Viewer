"use client";

import React, { useRef, useEffect, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { PostCard } from "./PostCard";
import { PostItem } from "@/types";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/StateDisplays";
import { ContentDetailModal } from "@/components/modals/ContentDetailModal";
import { Button } from "@/components/ui/Button";

interface InfinitePostFeedProps {
  posts: PostItem[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean | undefined;
  fetchNextPage: () => void;
  error: Error | null;
  onRetry: () => void;
  onResetFilters: () => void;
  username: string;
}

export function InfinitePostFeed({
  posts,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  error,
  onRetry,
  onResetFilters,
  username,
}: InfinitePostFeedProps) {
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Virtualizer for smooth rendering even with 10,000+ posts in memory
  const virtualizer = useWindowVirtualizer({
    count: posts.length,
    estimateSize: () => 180,
    overscan: 5,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  // IntersectionObserver to auto-fetch next page as user scrolls near bottom
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "500px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return <LoadingState message={`Loading posts for u/${username}...`} />;
  }

  if (error && posts.length === 0) {
    return (
      <ErrorState
        title="Could not load posts"
        message={error.message || "Failed to retrieve archived posts."}
        onRetry={onRetry}
      />
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        title="No posts found"
        description={`No submissions matched the selected filters for u/${username}.`}
        actionLabel="Reset filters"
        onAction={onResetFilters}
      />
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className="space-y-4">
      {/* Header Stats Bar */}
      <div className="flex items-center justify-between text-xs text-on-surface-variant px-1 pb-1">
        <span className="font-medium">
          Showing <strong className="text-on-surface">{posts.length.toLocaleString()}</strong> archived posts
        </span>
        {isFetchingNextPage && (
          <span className="flex items-center gap-1.5 text-primary">
            <span className="w-3 h-3 rounded-full border border-primary border-t-transparent animate-spin" />
            <span>Fetching more...</span>
          </span>
        )}
      </div>

      {/* Virtualized Posts Feed Container */}
      <div
        ref={listRef}
        className="relative w-full"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
        }}
      >
        {virtualItems.map((virtualRow) => {
          const post = posts[virtualRow.index];
          if (!post) return null;

          return (
            <div
              key={post.redditId || post.id || virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="pb-4"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
              }}
            >
              <PostCard post={post} onClick={() => setSelectedPost(post)} />
            </div>
          );
        })}
      </div>

      {/* Sentinel Element for Infinite Scroll */}
      <div ref={sentinelRef} className="h-4 w-full pointer-events-none" />

      {/* Feed Bottom Status: Loading / Fallback Load More / End of Data */}
      <div className="pt-2 pb-6 flex flex-col items-center justify-center space-y-3">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2.5 py-4 px-6 rounded-full bg-surface-container/80 border border-outline/30 text-xs font-medium text-on-surface-variant animate-in fade-in">
            <div className="w-4 h-4 rounded-full border-2 border-outline border-t-primary animate-spin" />
            <span>Loading older posts from archive...</span>
          </div>
        )}

        {!isFetchingNextPage && hasNextPage && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            icon="arrow_downward"
            className="rounded-full shadow-sm text-xs"
          >
            Load more posts
          </Button>
        )}

        {!hasNextPage && posts.length > 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-1 text-on-surface-variant/70 border-t border-outline/20 w-full mt-4">
            <span className="material-symbols-outlined text-[22px] text-primary/70">check_circle</span>
            <p className="text-xs font-semibold text-on-surface">End of posts archive</p>
            <p className="text-[11px]">All available submissions ({posts.length.toLocaleString()} items) have been loaded.</p>
          </div>
        )}
      </div>

      {/* Content Detail Modal */}
      {selectedPost && (
        <ContentDetailModal
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          type="POST"
          title={selectedPost.title}
          author={selectedPost.author || selectedPost.authorUsername || username}
          subreddit={selectedPost.subreddit || selectedPost.subredditName || ""}
          redditId={selectedPost.redditId}
          createdUtc={selectedPost.createdUtc}
          editedUtc={selectedPost.editedUtc}
          status={selectedPost.status}
          score={selectedPost.score}
          numComments={selectedPost.numComments}
          currentBody={selectedPost.selftext}
          permalink={selectedPost.permalink}
          mediaStatus={selectedPost.mediaStatus}
          mediaUrl={selectedPost.url}
          isNsfw={selectedPost.isNsfw}
          provenanceHistory={[
            {
              version: 1,
              recordedAt: selectedPost.createdUtc,
              status: selectedPost.status === "EDITED" ? "VISIBLE" : selectedPost.status,
              content: selectedPost.selftext,
            },
          ]}
        />
      )}
    </div>
  );
}
