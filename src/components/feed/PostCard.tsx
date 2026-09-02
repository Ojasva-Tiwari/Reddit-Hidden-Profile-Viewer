"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { StatusBadge, NsfwBadge } from "@/components/ui/StatusBadge";
import { MediaStatusBadge } from "@/components/ui/MediaStatusBadge";
import { PostItem } from "@/types";

interface PostCardProps {
  post: PostItem;
  onClick: () => void;
}

export const PostCard = React.memo(function PostCard({ post, onClick }: PostCardProps) {
  const hasMedia =
    post.url &&
    (post.url.endsWith(".jpg") ||
      post.url.endsWith(".jpeg") ||
      post.url.endsWith(".png") ||
      post.url.endsWith(".webp") ||
      post.url.includes("i.redd.it") ||
      post.url.includes("imgur"));

  return (
    <Card
      level={1}
      density="normal"
      hoverable
      onClick={onClick}
      className="space-y-3 cursor-pointer transition-all duration-200"
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

      {/* Media Preview if available (lazy-loaded) */}
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
});
