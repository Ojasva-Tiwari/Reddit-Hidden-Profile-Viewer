"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
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
    <>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md pb-xs border-b border-outline">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface flex items-center gap-xs">
            <span className="material-symbols-outlined text-[24px] text-secondary" data-icon="forum">
              forum
            </span>
            <span>Historical Comments Feed</span>
          </h1>
          <p className="font-code text-code text-on-surface-variant">
            Target: u/{username} • Showing {comments.length} records (Page {page})
          </p>
        </div>
      </div>

      {/* Archival Coverage Notice */}
      <div className="p-xs px-sm bg-surface-container border border-outline rounded-sm font-code text-[11px] text-on-surface-variant flex items-center gap-xs">
        <span className="material-symbols-outlined text-[14px] text-primary">info</span>
        <span>Archive coverage is historical. Records reflect snapshots preserved at time of ingestion.</span>
      </div>

      {/* Filter Toolbar */}
      <Card level={1} density="compact">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-sm">
          <div className="flex-1 w-full">
            <Input
              icon="search"
              placeholder="Search keywords in comments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-sm w-full md:w-auto">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="VISIBLE">Visible Only</option>
              <option value="DELETED">Deleted Only</option>
              <option value="REMOVED">Removed Only</option>
              <option value="EDITED">Edited Only</option>
              <option value="DELETED_LATER">Deleted Later</option>
            </Select>

            <Select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value);
                setPage(1);
              }}
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="score">Sort: Score</option>
            </Select>

            <Button type="submit" variant="secondary" size="md">
              FILTER
            </Button>
          </div>
        </form>
      </Card>

      {/* Comments List or State Displays */}
      {loading ? (
        <LoadingState message={`Retrieving comments feed for u/${username}...`} />
      ) : error ? (
        <ErrorState title="Comments Feed Query Failed" message={error} onRetry={fetchComments} />
      ) : comments.length === 0 ? (
        <EmptyState
          title="No Historical Comments Found"
          description={`No comments matching the selected filters were found for u/${username}.`}
          actionLabel="RESET FILTERS"
          onAction={() => {
            setStatusFilter("ALL");
            setSearchQuery("");
            setSortOption("newest");
            setPage(1);
          }}
        />
      ) : (
        <div className="space-y-sm">
          {comments.map((c) => (
            <Card
              key={c.id}
              level={1}
              density="normal"
              hoverable
              onClick={() => setSelectedComment(c)}
              className="space-y-xs"
            >
              {/* Header info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-xs font-code text-code text-on-surface-variant">
                  <span className="text-secondary font-medium">r/{c.subreddit || c.subredditName}</span>
                  <span>•</span>
                  <span className="text-primary">{c.redditId}</span>
                  <span>•</span>
                  <span>{new Date(c.createdUtc).toLocaleDateString()}</span>
                </div>
                <StatusBadge status={c.status} size="sm" />
              </div>

              {/* Parent context box if present */}
              {c.parentContext && (
                <div className="p-xs px-sm bg-surface-container-lowest border-l-2 border-outline font-body-dense text-[12px] text-on-surface-variant italic mb-xs">
                  In reply to u/{c.parentContext.author}: &quot;{c.parentContext.bodySnippet}&quot;
                </div>
              )}

              {/* Comment Body */}
              <p className="font-body-base text-body-base text-on-surface line-clamp-3">
                {c.body}
              </p>

              <div className="flex items-center justify-between pt-xs border-t border-outline/40 font-code text-code text-on-surface-variant">
                <span className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[14px]" data-icon="thumb_up">
                    thumb_up
                  </span>
                  Score: {c.score}
                </span>
                <span className="font-label-caps text-label-caps text-secondary">VIEW CONTEXT →</span>
              </div>
            </Card>
          ))}

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-md">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← PREVIOUS PAGE
            </Button>
            <span className="font-code text-code text-on-surface-variant">
              Page {page}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasMore}
              onClick={() => setPage((p) => p + 1)}
            >
              NEXT PAGE →
            </Button>
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
    </>
  );
}
