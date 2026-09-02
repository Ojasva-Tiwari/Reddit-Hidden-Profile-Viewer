"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { StatusBadge, NsfwBadge } from "@/components/ui/StatusBadge";
import { MediaStatusBadge } from "@/components/ui/MediaStatusBadge";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/StateDisplays";
import { ContentDetailModal } from "@/components/modals/ContentDetailModal";
import { PostItem } from "@/types";

export default function PostsFeedPage({ params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username).replace(/^u\//i, "");

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOption, setSortOption] = useState("newest");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`/api/profile/${encodeURIComponent(username)}/posts`, window.location.origin);
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", "25");
      url.searchParams.set("sort", sortOption);
      if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter);
      if (searchQuery.trim()) url.searchParams.set("search", searchQuery.trim());

      const res = await fetch(url.toString());
      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error?.message || "Failed to load posts from archive.");
      } else {
        setPosts(json.data || []);
        setHasMore(json.meta?.pagination?.hasMore || false);
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [username, page, statusFilter, sortOption]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPosts();
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
            placeholder="Search posts..."
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
            <option value="comments">Most comments</option>
          </select>
        </div>
      </form>

      {/* Posts List */}
      {loading ? (
        <LoadingState message={`Loading posts for u/${username}...`} />
      ) : error ? (
        <ErrorState title="Could not load posts" message={error} onRetry={fetchPosts} />
      ) : posts.length === 0 ? (
        <EmptyState
          title="No posts found"
          description={`No submissions matched the selected filters for u/${username}.`}
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
          {posts.map((post) => {
            const hasMedia = post.url && (post.url.endsWith(".jpg") || post.url.endsWith(".png") || post.url.endsWith(".webp") || post.url.includes("i.redd.it") || post.url.includes("imgur"));

            return (
              <Card
                key={post.id}
                level={1}
                density="normal"
                hoverable
                onClick={() => setSelectedPost(post)}
                className="space-y-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">
                      r/{post.subreddit || post.subredditName}
                    </span>
                    {post.isNsfw && <NsfwBadge size="sm" />}
                    <span>•</span>
                    <span>{new Date(post.createdUtc).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {post.mediaStatus && post.mediaStatus !== "MEDIA_UNAVAILABLE" && (
                      <MediaStatusBadge status={post.mediaStatus} size="sm" />
                    )}
                    <StatusBadge status={post.status} size="sm" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base sm:text-lg font-semibold text-on-surface leading-snug">
                  {post.title}
                </h3>

                {/* Body Snippet */}
                {post.selftext && (
                  <p className="text-sm text-on-surface-variant line-clamp-3 leading-relaxed">
                    {post.selftext}
                  </p>
                )}

                {/* Media Preview if available */}
                {hasMedia && (
                  <div className="rounded-xl overflow-hidden max-h-72 bg-surface-container border border-outline/40 flex items-center justify-center my-2">
                    <img
                      src={post.url}
                      alt={post.title}
                      loading="lazy"
                      decoding="async"
                      className="max-h-72 w-auto max-w-full object-contain rounded-lg"
                    />
                  </div>
                )}

                {/* Stats Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-outline/30 text-xs text-on-surface-variant">
                  <div className="flex items-center gap-4 font-medium">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-primary">
                        arrow_upward
                      </span>
                      {post.score}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">
                        chat_bubble
                      </span>
                      {post.numComments}
                    </span>
                  </div>

                  <span className="text-xs text-primary font-medium flex items-center gap-1">
                    <span>View full post</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </span>
                </div>
              </Card>
            );
          })}

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
