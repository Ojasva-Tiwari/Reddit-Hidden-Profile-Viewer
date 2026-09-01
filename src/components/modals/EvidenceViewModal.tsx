"use client";

import React, { useState } from "react";
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
  status: ContentStatusType | string;
  capturedUtc?: string;
  sourceOrigin?: string;
  onOpenContentDetail?: (redditId: string) => void;
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
  capturedUtc,
  sourceOrigin = "ARCTIC_SHIFT",
  onOpenContentDetail,
}: EvidenceViewModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(exactQuote);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface-container-low border border-outline w-full max-w-3xl max-h-[92vh] rounded-sm shadow-2xl flex flex-col overflow-hidden">
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
            className="p-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-sm transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="close">
              close
            </span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-md md:p-lg overflow-y-auto flex-1 space-y-lg font-body-base text-body-base leading-relaxed">
          {/* Section 1: SOURCE RECORD & ARCHIVE METADATA */}
          <div className="space-y-xs">
            <h4 className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-xs">
              <span className="material-symbols-outlined text-[16px] text-secondary">database</span>
              <span>1. SOURCE RECORD & ARCHIVAL METADATA</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-xs p-sm bg-surface-container-lowest border border-outline rounded-sm font-code text-code text-[11px]">
              <div>
                <span className="text-on-surface-variant block text-[10px]">RECORD TYPE</span>
                <span className="text-primary font-bold uppercase">{sourceType}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block text-[10px]">REDDIT FULLNAME</span>
                <span className="text-secondary font-bold">{redditId}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block text-[10px]">COMMUNITY</span>
                <span className="text-on-surface">r/{subreddit}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block text-[10px]">STATUS</span>
                <div className="mt-[2px]">
                  <StatusBadge status={status} size="sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: EXTRACTED EVIDENCE QUOTE */}
          <div className="space-y-xs">
            <h4 className="font-label-caps text-label-caps text-secondary flex items-center gap-xs">
              <span className="material-symbols-outlined text-[16px]">format_quote</span>
              <span>2. EXTRACTED SUPPORTING QUOTE</span>
            </h4>
            <div className="p-md bg-[#0D1117] border-l-2 border-secondary rounded-r-sm font-body-base text-on-surface italic">
              &quot;{exactQuote}&quot;
            </div>
          </div>

          {/* Section 3: AI INSIGHT CORRELATION */}
          <div className="space-y-xs">
            <h4 className="font-label-caps text-label-caps text-primary flex items-center gap-xs">
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              <span>3. SYNTHESIS CORRELATION NOTES</span>
            </h4>
            <p className="font-body-dense text-body-dense text-on-surface-variant p-sm bg-surface-container-lowest border border-outline rounded-sm">
              {correlationNotes}
            </p>
          </div>

          {/* Section 4: COMPLETE SUPPORTING CONTEXT */}
          <div className="space-y-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-label-caps text-label-caps text-on-surface-variant">
                4. COMPLETE {sourceType} TEXTUAL CONTEXT
              </h4>
              {onOpenContentDetail && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenContentDetail(redditId);
                  }}
                  className="font-label-caps text-label-caps text-secondary hover:underline flex items-center gap-[2px]"
                >
                  <span>OPEN FULL CONTENT DETAIL</span>
                  <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                </button>
              )}
            </div>
            <div className="p-md bg-surface-container-lowest border border-outline rounded-sm font-body-dense text-on-surface max-h-48 overflow-y-auto whitespace-pre-wrap">
              {fullText || "(No surrounding textual body)"}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-sm px-md border-t border-outline bg-surface-container flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            icon={copied ? "check" : "content_copy"}
            onClick={handleCopy}
          >
            {copied ? "COPIED TO CLIPBOARD" : "COPY EVIDENCE QUOTE"}
          </Button>

          <Button variant="secondary" size="sm" onClick={onClose}>
            CLOSE
          </Button>
        </div>
      </div>
    </div>
  );
}
