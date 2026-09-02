"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { StatusBadge, NsfwBadge } from "@/components/ui/StatusBadge";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/StateDisplays";
import { ContentDetailModal } from "@/components/modals/ContentDetailModal";
import { CommentItem } from "@/types";

export default function CommentsFeedPage({ params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username).replace(/^u\//i, "");

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOption, setSortOption] = useState("newest");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [selectedComment, setSelectedComment] = useState<CommentItem | null>(null);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`/api/profile/${encodeURIComponent(username)}/comments`, window.location.origin);
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", "25");
      url.searchParams.set("sort", sortOption);
      if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter);
      if (searchQuery.trim()) url.searchParams.set("search", searchQuery.trim());

      const res = await fetch(url.toString());
      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error?.message || "Failed to load comments from archive.");
      } else {
        setComments(json.data || []);
        setHasMore(json.meta?.pagination?.hasMore || false);
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [username, page, statusFilter, sortOption]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchComments();
  };

  return (
    <div className="space-y-6">
      {/* Clean Filter Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-col sm:flex-row items-center gap-3 bg-surface-container/60 p-2 sm:p-2.5 rounded-2xl border border-outline/40"
      >
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface text-on-surface placeholder:text-on-surface-variant/50 border border-outline/50 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-surface text-on-surface border border-outline/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors flex-1 sm:flex-none cursor-pointer"
          >
            <option value="ALL">All content</option>
            <option value="VISIBLE">Visible only</option>
            <option value="DELETED">Deleted only</option>
            <option value="REMOVED">Removed only</option>
            <option value="EDITED">Edited only</option>
            <option value="DELETED_LATER">Deleted later</option>
          </select>

          <select
            value={sortOption}
            onChange={(e) => {
              setSortOption(e.target.value);
              setPage(1);
            }}
            className="bg-surface text-on-surface border border-outline/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors flex-1 sm:flex-none cursor-pointer"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="score">Highest score</option>
          </select>
        </div>
      </form>

      {/* Comments List */}
      {loading ? (
        <LoadingState message={`Loading comments for u/${username}...`} />
      ) : error ? (
        <ErrorState title="Could not load comments" message={error} onRetry={fetchComments} />
      ) : comments.length === 0 ? (
        <EmptyState
          title="No comments found"
          description={`No comments matched the selected filters for u/${username}.`}
          actionLabel="Reset filters"
          onAction={() => {
            setStatusFilter("ALL");
            setSearchQuery("");
            setSortOption("newest");
            setPage(1);
          }}
        />
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <Card
              key={c.id}
              level={1}
              density="normal"
              hoverable
              onClick={() => setSelectedComment(c)}
              className="space-y-3"
            >
              {/* Header info */}
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-primary">
                    r/{c.subreddit || c.subredditName}
                  </span>
                  {c.isNsfw && <NsfwBadge size="sm" />}
                  <span>•</span>
                  <span>{new Date(c.createdUtc).toLocaleDateString()}</span>
                </div>
                <StatusBadge status={c.status} size="sm" />
              </div>

              {/* Parent context box if present */}
              {c.parentContext && (
                <div className="p-3 bg-surface-container rounded-xl text-xs text-on-surface-variant space-y-0.5">
                  <span className="font-medium text-on-surface">
                    In reply to u/{c.parentContext.author || "user"}:
                  </span>
                  <p className="italic line-clamp-2">
                    &ldquo;{c.parentContext.bodySnippet || "..."}&rdquo;
                  </p>
                </div>
              )}

              {/* Comment Body */}
              <p className="text-sm text-on-surface line-clamp-4 leading-relaxed whitespace-pre-wrap">
                {c.body}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-outline/30 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1 font-medium text-on-surface">
                  <span className="material-symbols-outlined text-[15px] text-primary">
                    arrow_upward
                  </span>
                  {c.score}
                </span>

                <span className="text-xs text-primary font-medium flex items-center gap-1">
                  <span>View context</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </Card>
          ))}

          {/* Clean Pagination */}
          <div className="flex items-center justify-between pt-4 text-sm">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-full border border-outline/50 bg-surface-container hover:bg-surface-container-high text-on-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-xs text-on-surface-variant font-medium">
              Page {page}
            </span>
            <button
              disabled={!hasMore}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-full border border-outline/50 bg-surface-container hover:bg-surface-container-high text-on-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

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
