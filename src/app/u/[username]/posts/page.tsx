"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
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
    <>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md pb-xs border-b border-outline">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface flex items-center gap-xs">
            <span className="material-symbols-outlined text-[24px] text-secondary" data-icon="article">
              article
            </span>
            <span>Historical Posts Feed</span>
          </h1>
          <p className="font-code text-code text-on-surface-variant">
            Target: u/{username} • Showing {posts.length} records (Page {page})
          </p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <Card level={1} density="compact">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-sm">
          <div className="flex-1 w-full">
            <Input
              icon="search"
              placeholder="Search keywords in title or selftext..."
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
              <option value="comments">Sort: Comments</option>
            </Select>

            <Button type="submit" variant="secondary" size="md">
              FILTER
            </Button>
          </div>
        </form>
      </Card>

      {/* Posts List or State Displays */}
      {loading ? (
        <LoadingState message={`Retrieving posts feed for u/${username}...`} />
      ) : error ? (
        <ErrorState title="Posts Feed Query Failed" message={error} onRetry={fetchPosts} />
      ) : posts.length === 0 ? (
        <EmptyState
          title="No Historical Submissions Found"
          description={`No posts matching the selected filters were found for u/${username}.`}
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
          {posts.map((post) => (
            <Card
              key={post.id}
              level={1}
              density="normal"
              hoverable
              onClick={() => setSelectedPost(post)}
              className="space-y-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-xs font-code text-code text-on-surface-variant">
                  <span className="text-secondary font-medium">r/{post.subreddit || post.subredditName}</span>
                  <span>•</span>
                  <span className="text-primary">{post.redditId}</span>
                  <span>•</span>
                  <span>{new Date(post.createdUtc).toLocaleDateString()}</span>
                </div>
                <StatusBadge status={post.status} size="sm" />
              </div>

              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                {post.title}
              </h3>

              {post.selftext && (
                <p className="font-body-dense text-body-dense text-on-surface-variant line-clamp-2">
                  {post.selftext}
                </p>
              )}

              <div className="flex items-center justify-between pt-xs border-t border-outline/40 font-code text-code text-on-surface-variant">
                <div className="flex items-center gap-md">
                  <span className="flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[14px]" data-icon="thumb_up">
                      thumb_up
                    </span>
                    {post.score}
                  </span>
                  <span className="flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[14px]" data-icon="forum">
                      forum
                    </span>
                    {post.numComments}
                  </span>
                </div>
                <span className="font-label-caps text-label-caps text-secondary">INSPECT PROVENANCE →</span>
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
      {selectedPost && (
        <ContentDetailModal
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
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
    </>
  );
}
