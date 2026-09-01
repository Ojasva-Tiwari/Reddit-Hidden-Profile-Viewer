"use client";

import React, { useState } from "react";
import { StatusBadge, ContentStatusType } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";

export interface ProvenanceRecord {
  version: number;
  recordedAt: string;
  status: ContentStatusType;
  content: string;
  diffPatch?: string;
}

export interface ContentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  author: string;
  subreddit: string;
  redditId: string;
  createdUtc: string;
  editedUtc?: string | null;
  status: ContentStatusType;
  score: number;
  numComments?: number;
  currentBody: string;
  provenanceHistory?: ProvenanceRecord[];
  rawPayload?: any;
}

export function ContentDetailModal({
  isOpen,
  onClose,
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
  provenanceHistory = [],
  rawPayload,
}: ContentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"CONTENT" | "PROVENANCE" | "RAW_JSON">("CONTENT");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface-container-low border border-outline w-full max-w-3xl max-h-[90vh] rounded-sm shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-md border-b border-outline flex items-start justify-between gap-md bg-surface">
          <div>
            <div className="flex items-center gap-sm mb-xs">
              <span className="font-code text-code text-secondary font-medium">r/{subreddit}</span>
              <span className="text-outline">•</span>
              <span className="font-code text-code text-on-surface-variant">u/{author}</span>
              <span className="text-outline">•</span>
              <span className="font-code text-code text-on-surface-variant">{redditId}</span>
              <StatusBadge status={status} size="sm" />
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold line-clamp-2">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="close">
              close
            </span>
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-xs px-md border-b border-outline bg-surface-container-lowest text-label-caps font-label-caps">
          <button
            onClick={() => setActiveTab("CONTENT")}
            className={`py-xs px-sm border-b-2 transition-colors ${
              activeTab === "CONTENT" ? "border-secondary text-on-surface font-semibold" : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            CONTENT VIEW
          </button>
          <button
            onClick={() => setActiveTab("PROVENANCE")}
            className={`py-xs px-sm border-b-2 transition-colors ${
              activeTab === "PROVENANCE" ? "border-secondary text-on-surface font-semibold" : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            PROVENANCE & DIFFS ({provenanceHistory.length})
          </button>
          <button
            onClick={() => setActiveTab("RAW_JSON")}
            className={`py-xs px-sm border-b-2 transition-colors ${
              activeTab === "RAW_JSON" ? "border-secondary text-on-surface font-semibold" : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            RAW METADATA
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-md overflow-y-auto flex-1 font-body-base text-body-base leading-relaxed space-y-md">
          {activeTab === "CONTENT" && (
            <div>
              {/* Meta bar */}
              <div className="flex items-center gap-md font-code text-code text-on-surface-variant mb-md pb-xs border-b border-outline/50">
                <span>Score: {score}</span>
                {numComments !== undefined && <span>Comments: {numComments}</span>}
                <span>Created: {new Date(createdUtc).toLocaleString()}</span>
                {editedUtc && <span>Edited: {new Date(editedUtc).toLocaleString()}</span>}
              </div>

              {/* Content text */}
              <div className="p-md bg-surface-container-lowest border border-outline rounded-sm whitespace-pre-wrap font-body-base text-on-surface">
                {currentBody || <span className="italic text-on-surface-variant">[No body text or selftext]</span>}
              </div>
            </div>
          )}

          {activeTab === "PROVENANCE" && (
            <div className="space-y-md">
              {provenanceHistory.length === 0 ? (
                <div className="p-md bg-surface-container-lowest border border-outline rounded-sm text-on-surface-variant font-code text-code text-center">
                  No subsequent edit revisions recorded for this item.
                </div>
              ) : (
                provenanceHistory.map((rev) => (
                  <div key={rev.version} className="p-md bg-surface-container-lowest border border-outline rounded-sm space-y-xs">
                    <div className="flex items-center justify-between font-label-caps text-label-caps text-on-surface-variant pb-xs border-b border-outline">
                      <span>VERSION #{rev.version}</span>
                      <span>{new Date(rev.recordedAt).toLocaleString()}</span>
                      <StatusBadge status={rev.status} size="sm" />
                    </div>
                    <div className="font-code text-code text-on-surface pt-xs whitespace-pre-wrap">
                      {rev.diffPatch ? (
                        <pre className="text-[11px] text-secondary font-mono overflow-x-auto">{rev.diffPatch}</pre>
                      ) : (
                        rev.content
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "RAW_JSON" && (
            <div className="p-md bg-surface-container-lowest border border-outline rounded-sm overflow-x-auto">
              <pre className="font-code text-[11px] text-primary">
                {JSON.stringify(rawPayload || { redditId, author, subreddit, score, createdUtc, status }, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-sm px-md border-t border-outline bg-surface-container flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            icon="content_copy"
            onClick={() => {
              navigator.clipboard.writeText(currentBody);
              alert("Content copied to clipboard.");
            }}
          >
            COPY CONTENT
          </Button>

          <Button variant="secondary" size="sm" onClick={onClose}>
            CLOSE
          </Button>
        </div>
      </div>
    </div>
  );
}
