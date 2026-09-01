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
  exactQuote,
  fullText,
  correlationNotes,
  status,
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
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-outline/60 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
              #{insightNumber}
            </span>
            <h3 className="font-semibold text-base text-on-surface line-clamp-1">
              {insightTitle}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {/* Supporting Quote */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Supporting Evidence
            </span>
            <blockquote className="p-4 sm:p-5 bg-surface-container rounded-2xl border border-primary/20 text-on-surface font-serif text-base italic leading-relaxed">
              &ldquo;{exactQuote}&rdquo;
            </blockquote>
          </div>

          {/* Context & Source Details */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-on-surface-variant p-3 bg-surface-container rounded-xl border border-outline/40">
            <div className="flex items-center gap-2">
              <span className="font-medium text-on-surface">r/{subreddit}</span>
              <span>•</span>
              <span className="capitalize">{sourceType.toLowerCase()}</span>
              <span>•</span>
              <StatusBadge status={status} size="sm" />
            </div>

            {onOpenContentDetail && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenContentDetail(redditId);
                }}
                className="text-primary hover:underline font-medium flex items-center gap-1"
              >
                <span>View full post</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </button>
            )}
          </div>

          {/* Reasoning */}
          {correlationNotes && (
            <div className="space-y-1.5 text-xs">
              <span className="font-semibold text-on-surface">Why this supports the insight:</span>
              <p className="text-on-surface-variant leading-relaxed bg-surface-container/60 p-3.5 rounded-xl border border-outline/30">
                {correlationNotes}
              </p>
            </div>
          )}

          {/* Full context preview */}
          {fullText && fullText !== exactQuote && (
            <div className="space-y-1.5 text-xs">
              <span className="font-semibold text-on-surface">Surrounding context:</span>
              <div className="p-3.5 bg-surface-container/40 rounded-xl border border-outline/30 text-on-surface-variant max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {fullText}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-outline/40 bg-surface-container flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            icon={copied ? "check" : "content_copy"}
            onClick={handleCopy}
          >
            {copied ? "Copied" : "Copy quote"}
          </Button>

          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
