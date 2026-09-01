"use client";

import React, { useState } from "react";
import { StatusBadge, ContentStatusType } from "@/components/ui/StatusBadge";
import { ProvenanceViewer, ProvenanceVersion } from "@/components/ui/ProvenanceViewer";
import { MediaReferenceViewer } from "@/components/ui/MediaReferenceViewer";
import { Button } from "@/components/ui/Button";
import { MediaStatus } from "@/types";

export interface ContentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: "POST" | "COMMENT";
  title?: string;
  author: string;
  subreddit: string;
  redditId: string;
  createdUtc: string;
  editedUtc?: string | null;
  status: ContentStatusType | string;
  score: number;
  numComments?: number;
  currentBody: string;
  permalink?: string;
  mediaStatus?: MediaStatus;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  parentContext?: {
    author?: string;
    bodySnippet?: string;
    parentId?: string;
  };
  provenanceHistory?: ProvenanceVersion[];
  rawPayload?: any;
}

export function ContentDetailModal({
  isOpen,
  onClose,
  type = "POST",
  title,
  author,
  subreddit,
  redditId,
  createdUtc,
  editedUtc,
  status,
  score,
  numComments,
  currentBody,
  permalink,
  mediaStatus,
  mediaUrl,
  thumbnailUrl,
  parentContext,
  provenanceHistory = [],
}: ContentDetailModalProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentBody || title || "");
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const redditSourceUrl = permalink
    ? `https://reddit.com${permalink.startsWith("/") ? permalink : "/" + permalink}`
    : `https://reddit.com/r/${subreddit}/comments/${redditId.replace(/^t3_|^t1_/, "")}`;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-outline/60 w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header bar */}
        <div className="px-6 py-4 border-b border-outline/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <span className="font-semibold text-primary">r/{subreddit}</span>
            <span>•</span>
            <span>u/{author}</span>
            <span>•</span>
            <span>{new Date(createdUtc).toLocaleDateString()}</span>
            <StatusBadge status={status} size="sm" />
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-5">
          {/* Title */}
          {title && (
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface leading-snug">
              {title}
            </h2>
          )}

          {/* Parent Context for Comment */}
          {parentContext && (
            <div className="p-3.5 bg-surface-container rounded-xl text-xs text-on-surface-variant space-y-1">
              <span className="font-medium text-on-surface">
                Replying to u/{parentContext.author || "user"}:
              </span>
              <p className="italic line-clamp-2">
                &ldquo;{parentContext.bodySnippet || "..."}&rdquo;
              </p>
            </div>
          )}

          {/* Main Content Body */}
          {currentBody ? (
            <div className="text-base text-on-surface leading-relaxed whitespace-pre-wrap">
              {currentBody}
            </div>
          ) : !mediaUrl && !thumbnailUrl ? (
            <div className="text-sm italic text-on-surface-variant">
              (No body text recorded for this submission)
            </div>
          ) : null}

          {/* Large Media Preview */}
          {type === "POST" && (
            <MediaReferenceViewer
              mediaStatus={mediaStatus}
              mediaUrl={mediaUrl}
              thumbnailUrl={thumbnailUrl}
            />
          )}

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-outline/30 text-xs text-on-surface-variant">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 font-medium text-on-surface">
                <span className="material-symbols-outlined text-[16px] text-primary">arrow_upward</span>
                {score} upvotes
              </span>
              {numComments !== undefined && (
                <span className="flex items-center gap-1 font-medium text-on-surface">
                  <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                  {numComments} comments
                </span>
              )}
            </div>

            <a
              href={redditSourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary hover:underline flex items-center gap-1 font-medium"
            >
              <span>View on Reddit</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          </div>

          {/* Secondary Provenance & Details */}
          <ProvenanceViewer
            sourceId={redditId}
            capturedUtc={createdUtc}
            status={status}
            history={provenanceHistory}
          />
        </div>

        {/* Action Footer */}
        <div className="px-6 py-3.5 border-t border-outline/40 bg-surface-container flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            icon={copySuccess ? "check" : "content_copy"}
            onClick={handleCopy}
          >
            {copySuccess ? "Copied" : "Copy text"}
          </Button>

          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
