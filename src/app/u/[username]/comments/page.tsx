"use client";

import React, { useState } from "react";
import { SAMPLE_COMMENTS } from "@/lib/sampleData";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ContentDetailModal } from "@/components/modals/ContentDetailModal";

export default function CommentsFeedPage({ params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOption, setSortOption] = useState("newest");
  const [selectedComment, setSelectedComment] = useState<any | null>(null);

  const filteredComments = SAMPLE_COMMENTS.filter((comment) => {
    const matchesSearch = comment.body.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || comment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            Target: u/{username} • Showing {filteredComments.length} comment records
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card level={1} density="compact" className="flex flex-col md:flex-row items-center gap-sm">
        <div className="flex-1 w-full">
          <Input
            icon="search"
            placeholder="Search keywords in comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-sm w-full md:w-auto">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="VISIBLE">Visible Only</option>
            <option value="DELETED">Deleted Only</option>
            <option value="EDITED">Edited Only</option>
          </Select>

          <Select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="score">Sort: Score</option>
          </Select>
        </div>
      </Card>

      {/* Comments List */}
      <div className="space-y-sm">
        {filteredComments.map((c) => (
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
                <span className="text-secondary font-medium">r/{c.subreddit}</span>
                <span>•</span>
                <span>{c.redditId}</span>
                <span>•</span>
                <span>{new Date(c.createdUtc).toLocaleDateString()}</span>
              </div>
              <StatusBadge status={c.status} size="sm" />
            </div>

            {/* Parent context box if present */}
            {c.parentContext && (
              <div className="p-xs px-sm bg-surface-container-lowest border-l-2 border-outline font-body-dense text-[12px] text-on-surface-variant italic mb-xs">
                In reply to u/{c.parentContext.author}: "{c.parentContext.bodySnippet}"
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
              <span className="font-label-caps text-label-caps text-secondary">VIEW THREAD CONTEXT →</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Content Detail Modal */}
      {selectedComment && (
        <ContentDetailModal
          isOpen={!!selectedComment}
          onClose={() => setSelectedComment(null)}
          title={`Comment in r/${selectedComment.subreddit}`}
          author={selectedComment.author}
          subreddit={selectedComment.subreddit}
          redditId={selectedComment.redditId}
          createdUtc={selectedComment.createdUtc}
          editedUtc={selectedComment.editedUtc}
          status={selectedComment.status}
          score={selectedComment.score}
          currentBody={selectedComment.body}
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
