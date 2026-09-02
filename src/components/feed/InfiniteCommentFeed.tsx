"use client";

import React, { useRef, useEffect, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { CommentCard } from "./CommentCard";
import { CommentItem } from "@/types";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/StateDisplays";
import { ContentDetailModal } from "@/components/modals/ContentDetailModal";
import { Button } from "@/components/ui/Button";

interface InfiniteCommentFeedProps {
  comments: CommentItem[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean | undefined;
  fetchNextPage: () => void;
  error: Error | null;
  onRetry: () => void;
  onResetFilters: () => void;
  username: string;
}

export function InfiniteCommentFeed({
  comments,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  error,
  onRetry,
  onResetFilters,
  username,
}: InfiniteCommentFeedProps) {
  const [selectedComment, setSelectedComment] = useState<CommentItem | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Virtualizer for smooth rendering even with 10,000+ comments in memory
  const virtualizer = useWindowVirtualizer({
    count: comments.length,
    estimateSize: () => 160,
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
    return <LoadingState message={`Loading comments for u/${username}...`} />;
  }

  if (error && comments.length === 0) {
    return (
      <ErrorState
        title="Could not load comments"
        message={error.message || "Failed to retrieve archived comments."}
        onRetry={onRetry}
      />
    );
  }

  if (comments.length === 0) {
    return (
      <EmptyState
        title="No comments found"
        description={`No comments matched the selected filters for u/${username}.`}
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
          Showing <strong className="text-on-surface">{comments.length.toLocaleString()}</strong> archived comments
        </span>
        {isFetchingNextPage && (
          <span className="flex items-center gap-1.5 text-primary">
            <span className="w-3 h-3 rounded-full border border-primary border-t-transparent animate-spin" />
            <span>Fetching more...</span>
          </span>
        )}
      </div>

      {/* Virtualized Comments Feed Container */}
      <div
        ref={listRef}
        className="relative w-full"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
        }}
      >
        {virtualItems.map((virtualRow) => {
          const comment = comments[virtualRow.index];
          if (!comment) return null;

          return (
            <div
              key={comment.redditId || comment.id || virtualRow.key}
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
              <CommentCard comment={comment} onClick={() => setSelectedComment(comment)} />
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
            <span>Loading older comments from archive...</span>
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
            Load more comments
          </Button>
        )}

        {!hasNextPage && comments.length > 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-1 text-on-surface-variant/70 border-t border-outline/20 w-full mt-4">
            <span className="material-symbols-outlined text-[22px] text-primary/70">check_circle</span>
            <p className="text-xs font-semibold text-on-surface">End of comments archive</p>
            <p className="text-[11px]">All available comments ({comments.length.toLocaleString()} items) have been loaded.</p>
          </div>
        )}
      </div>

      {/* Content Detail Modal */}
      {selectedComment && (
        <ContentDetailModal
          isOpen={!!selectedComment}
          onClose={() => setSelectedComment(null)}
          type="COMMENT"
          title={`Comment in r/${selectedComment.subreddit || selectedComment.subredditName || ""}`}
          author={selectedComment.author || selectedComment.authorUsername || username}
          subreddit={selectedComment.subreddit || selectedComment.subredditName || ""}
          redditId={selectedComment.redditId}
          createdUtc={selectedComment.createdUtc}
          editedUtc={selectedComment.editedUtc}
          status={selectedComment.status}
          score={selectedComment.score}
          currentBody={selectedComment.body}
          permalink={selectedComment.permalink}
          isNsfw={selectedComment.isNsfw}
          parentContext={
            selectedComment.parentContext
              ? {
                  author: selectedComment.parentContext.author,
                  bodySnippet: selectedComment.parentContext.bodySnippet,
                  parentId: selectedComment.parentId || selectedComment.parentRedditId,
                }
              : undefined
          }
          provenanceHistory={[
            {
              version: 1,
              recordedAt: selectedComment.createdUtc,
              status: selectedComment.status === "EDITED" ? "VISIBLE" : selectedComment.status,
              content: selectedComment.body,
            },
          ]}
        />
      )}
    </div>
  );
}
