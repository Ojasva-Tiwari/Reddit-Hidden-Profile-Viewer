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
  rawPayload,
}: ContentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"CONTENT" | "PROVENANCE" | "RAW_METADATA">("CONTENT");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface-container-low border border-outline w-full max-w-4xl max-h-[92vh] rounded-sm shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-md border-b border-outline flex items-start justify-between gap-md bg-surface">
          <div className="space-y-xs">
            <div className="flex flex-wrap items-center gap-xs font-code text-code text-on-surface-variant text-[12px]">
              <span className="px-xs py-[1px] bg-surface-container-high rounded-sm text-primary font-bold uppercase">
                {type}
              </span>
              <span className="text-outline">•</span>
              <span className="text-secondary font-medium">r/{subreddit}</span>
              <span className="text-outline">•</span>
              <span>u/{author}</span>
              <span className="text-outline">•</span>
              <span className="text-primary">{redditId}</span>
              <StatusBadge status={status} size="sm" />
            </div>

            {title && (
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold line-clamp-2">
                {title}
              </h3>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-sm transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="close">
              close
            </span>
          </button>
        </div>

        {/* View Navigation Tabs */}
        <div className="flex items-center gap-xs px-md border-b border-outline bg-surface-container-lowest text-label-caps font-label-caps">
          <button
            onClick={() => setActiveTab("CONTENT")}
            className={`py-xs px-sm border-b-2 transition-colors ${
              activeTab === "CONTENT"
                ? "border-secondary text-on-surface font-semibold"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            CONTENT VIEW
          </button>
          <button
            onClick={() => setActiveTab("PROVENANCE")}
            className={`py-xs px-sm border-b-2 transition-colors ${
              activeTab === "PROVENANCE"
                ? "border-secondary text-on-surface font-semibold"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            PROVENANCE & DIFFS
          </button>
          <button
            onClick={() => setActiveTab("RAW_METADATA")}
            className={`py-xs px-sm border-b-2 transition-colors ${
              activeTab === "RAW_METADATA"
                ? "border-secondary text-on-surface font-semibold"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            RAW ARCTIC METADATA
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-md md:p-lg overflow-y-auto flex-1 font-body-base text-body-base leading-relaxed space-y-md">
          {activeTab === "CONTENT" && (
            <div className="space-y-md">
              {/* Meta metrics bar */}
              <div className="flex flex-wrap items-center justify-between gap-sm font-code text-code text-on-surface-variant pb-xs border-b border-outline/50 text-[12px]">
                <div className="flex items-center gap-md">
                  <span className="flex items-center gap-xs text-on-surface">
                    <span className="material-symbols-outlined text-[14px]">thumb_up</span>
                    Score: {score}
                  </span>
                  {numComments !== undefined && (
                    <span className="flex items-center gap-xs text-on-surface">
                      <span className="material-symbols-outlined text-[14px]">forum</span>
                      {numComments} Comments
                    </span>
                  )}
                  <span>Created: {new Date(createdUtc).toLocaleString()}</span>
                  {editedUtc && <span>Edited: {new Date(editedUtc).toLocaleString()}</span>}
                </div>

                <a
                  href={redditSourceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-secondary hover:underline flex items-center gap-[2px] text-[11px]"
                >
                  <span>VIEW REDDIT THREAD</span>
                  <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                </a>
              </div>

              {/* Parent Context if present */}
              {parentContext && (
                <div className="p-sm px-md bg-surface-container-lowest border-l-2 border-secondary rounded-r-sm font-body-dense text-[13px] text-on-surface-variant italic">
                  In reply to u/{parentContext.author || "user"}: &quot;{parentContext.bodySnippet || "..."}&quot;
                </div>
              )}

              {/* Primary Content Body */}
              <div className="p-md md:p-lg bg-surface-container-lowest border border-outline rounded-sm whitespace-pre-wrap font-body-base text-on-surface">
                {currentBody || (
                  <span className="italic text-on-surface-variant/80">
                    [No textual body recorded for this {type.toLowerCase()}]
                  </span>
                )}
              </div>

              {/* Attached Media Reference */}
              {type === "POST" && (
                <MediaReferenceViewer
                  mediaStatus={mediaStatus}
                  mediaUrl={mediaUrl}
                  thumbnailUrl={thumbnailUrl}
                />
              )}
            </div>
          )}

          {activeTab === "PROVENANCE" && (
            <ProvenanceViewer
              sourceId={redditId}
              capturedUtc={createdUtc}
              status={status}
              history={provenanceHistory}
            />
          )}

          {activeTab === "RAW_METADATA" && (
            <div className="space-y-xs">
              <span className="font-label-caps text-label-caps text-on-surface-variant block">
                RAW JSON PAYLOAD STORED IN ARCHIVE
              </span>
              <div className="p-md bg-[#0D1117] border border-outline rounded-sm overflow-x-auto max-h-96">
                <pre className="font-code text-[11px] text-primary">
                  {JSON.stringify(rawPayload || { redditId, author, subreddit, score, createdUtc, status, type }, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-sm px-md border-t border-outline bg-surface-container flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            icon={copySuccess ? "check" : "content_copy"}
            onClick={handleCopy}
          >
            {copySuccess ? "COPIED TO CLIPBOARD" : "COPY CONTENT"}
          </Button>

          <Button variant="secondary" size="sm" onClick={onClose}>
            CLOSE
          </Button>
        </div>
      </div>
    </div>
  );
}
