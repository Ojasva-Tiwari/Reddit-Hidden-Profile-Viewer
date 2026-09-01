"use client";

import React, { useState } from "react";
import { SAMPLE_POSTS } from "@/lib/sampleData";
import { Card } from "@/components/ui/Card";
import { StatusBadge, ContentStatusType } from "@/components/ui/StatusBadge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ContentDetailModal } from "@/components/modals/ContentDetailModal";

export default function PostsFeedPage({ params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOption, setSortOption] = useState("newest");
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  const filteredPosts = SAMPLE_POSTS.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.selftext.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            Target: u/{username} • Showing {filteredPosts.length} submissions
          </p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <Card level={1} density="compact" className="flex flex-col md:flex-row items-center gap-sm">
        <div className="flex-1 w-full">
          <Input
            icon="search"
            placeholder="Search keywords in title or selftext..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-sm w-full md:w-auto">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="VISIBLE">Visible Only</option>
            <option value="DELETED">Deleted Only</option>
            <option value="REMOVED">Removed Only</option>
            <option value="EDITED">Edited Only</option>
          </Select>

          <Select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="score">Sort: Score</option>
            <option value="comments">Sort: Comments</option>
          </Select>
        </div>
      </Card>

      {/* Posts List */}
      <div className="space-y-sm">
        {filteredPosts.map((post) => (
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
                <span className="text-secondary font-medium">r/{post.subreddit}</span>
                <span>•</span>
                <span>{post.redditId}</span>
                <span>•</span>
                <span>{new Date(post.createdUtc).toLocaleDateString()}</span>
              </div>
              <StatusBadge status={post.status} size="sm" />
            </div>

            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              {post.title}
            </h3>

            <p className="font-body-dense text-body-dense text-on-surface-variant line-clamp-2">
              {post.selftext}
            </p>

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
      </div>

      {/* Content Detail Modal */}
      {selectedPost && (
        <ContentDetailModal
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          title={selectedPost.title}
          author={selectedPost.author}
          subreddit={selectedPost.subreddit}
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
