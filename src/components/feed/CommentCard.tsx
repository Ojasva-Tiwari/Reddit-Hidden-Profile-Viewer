"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { StatusBadge, NsfwBadge } from "@/components/ui/StatusBadge";
import { CommentItem } from "@/types";

interface CommentCardProps {
  comment: CommentItem;
  onClick: () => void;
}

export const CommentCard = React.memo(function CommentCard({ comment, onClick }: CommentCardProps) {
  return (
    <Card
      level={1}
      density="normal"
      hoverable
      onClick={onClick}
      className="space-y-3 cursor-pointer transition-all duration-200"
    >
      {/* Header info */}
      <div className="flex items-center justify-between text-xs text-on-surface-variant">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-primary">
            r/{comment.subreddit || comment.subredditName}
          </span>
          {comment.isNsfw && <NsfwBadge size="sm" />}
          <span>•</span>
          <span>{new Date(comment.createdUtc).toLocaleDateString()}</span>
        </div>
        <StatusBadge status={comment.status} size="sm" />
      </div>

      {/* Parent context box if present */}
      {comment.parentContext && (
        <div className="p-3 bg-surface-container rounded-xl text-xs text-on-surface-variant space-y-0.5">
          <span className="font-medium text-on-surface">
            In reply to u/{comment.parentContext.author || "user"}:
          </span>
          <p className="italic line-clamp-2">
            &ldquo;{comment.parentContext.bodySnippet || "..."}&rdquo;
          </p>
        </div>
      )}

      {/* Comment Body */}
      <p className="text-sm text-on-surface line-clamp-4 leading-relaxed whitespace-pre-wrap">
        {comment.body}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-outline/30 text-xs text-on-surface-variant">
        <span className="flex items-center gap-1 font-medium text-on-surface">
          <span className="material-symbols-outlined text-[15px] text-primary">
            arrow_upward
          </span>
          {comment.score}
        </span>

        <span className="text-xs text-primary font-medium flex items-center gap-1">
          <span>View context</span>
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </span>
      </div>
    </Card>
  );
});
