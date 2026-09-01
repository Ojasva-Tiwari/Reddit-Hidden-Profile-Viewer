"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { StatusBadge, ContentStatusType } from "@/components/ui/StatusBadge";

export interface EvidenceViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  insightTitle: string;
  insightNumber: number;
  redditId: string;
  sourceType: "POST" | "COMMENT";
  subreddit: string;
  score: number;
  commentsCount?: number;
  exactQuote: string;
  fullText: string;
  correlationNotes: string;
  status: ContentStatusType;
}

export function EvidenceViewModal({
  isOpen,
  onClose,
  insightTitle,
  insightNumber,
  redditId,
  sourceType,
  subreddit,
  score,
  commentsCount,
  exactQuote,
  fullText,
  correlationNotes,
  status,
}: EvidenceViewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface-container-low border border-outline w-full max-w-2xl max-h-[90vh] rounded-sm shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-md border-b border-outline flex items-start justify-between gap-md bg-surface">
          <div>
            <div className="flex items-center gap-xs font-label-caps text-label-caps text-primary mb-xs">
              <span className="material-symbols-outlined text-[16px]" data-icon="policy">
                policy
              </span>
              <span>GROUNDED EVIDENCE CITATION (INSIGHT #{insightNumber})</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              {insightTitle}
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

        {/* Scrollable Body */}
        <div className="p-md overflow-y-auto flex-1 space-y-md">
          {/* Source Record Banner */}
          <div className="p-sm bg-surface-container-lowest border border-outline rounded-sm flex items-center justify-between font-code text-code text-on-surface-variant">
            <div className="flex items-center gap-sm">
              <span className="text-secondary font-medium">r/{subreddit}</span>
              <span>•</span>
              <span>ID: {redditId}</span>
              <span>•</span>
              <span>Score: {score}</span>
              {commentsCount !== undefined && (
                <>
                  <span>•</span>
                  <span>{commentsCount} comments</span>
                </>
              )}
            </div>
            <StatusBadge status={status} size="sm" />
          </div>

          {/* Extracted Evidence Quote (Highlighted) */}
          <div className="space-y-xs">
            <h4 className="font-label-caps text-label-caps text-secondary flex items-center gap-xs">
              <span className="material-symbols-outlined text-[16px]" data-icon="format_quote">
                format_quote
              </span>
              EXTRACTED PROVENANCE QUOTE
            </h4>
            <div className="p-md bg-[#0D1117] border-l-2 border-secondary rounded-r-sm font-body-base text-on-surface italic">
              &quot;{exactQuote}&quot;
            </div>
          </div>

          {/* AI Correlation Analysis */}
          <div className="space-y-xs">
            <h4 className="font-label-caps text-label-caps text-primary flex items-center gap-xs">
              <span className="material-symbols-outlined text-[16px]" data-icon="auto_awesome">
                auto_awesome
              </span>
              AI INSIGHT CORRELATION
            </h4>
            <p className="font-body-dense text-body-dense text-on-surface-variant p-sm bg-surface-container-lowest border border-outline rounded-sm">
              {correlationNotes}
            </p>
          </div>

          {/* Full Content Context */}
          <div className="space-y-xs">
            <h4 className="font-label-caps text-label-caps text-on-surface-variant">
              FULL {sourceType} CONTEXT
            </h4>
            <div className="p-md bg-surface-container-lowest border border-outline rounded-sm font-body-dense text-on-surface max-h-48 overflow-y-auto whitespace-pre-wrap">
              {fullText}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-sm px-md border-t border-outline bg-surface-container flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            icon="content_copy"
            onClick={() => {
              navigator.clipboard.writeText(exactQuote);
              alert("Evidence quote copied to clipboard.");
            }}
          >
            COPY RAW EVIDENCE
          </Button>

          <Button variant="secondary" size="sm" onClick={onClose}>
            CLOSE
          </Button>
        </div>
      </div>
    </div>
  );
}
