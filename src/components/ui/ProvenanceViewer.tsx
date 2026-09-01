"use client";

import React, { useState } from "react";
import { ContentStatus } from "@/types";
import { StatusBadge } from "./StatusBadge";

export interface ProvenanceVersion {
  version: number;
  recordedAt: string;
  status: ContentStatus | string;
  content: string;
  diffPatch?: string;
  authorUsername?: string;
}

interface ProvenanceViewerProps {
  sourceOrigin?: string;
  sourceId: string;
  capturedUtc: string;
  status: ContentStatus | string;
  history?: ProvenanceVersion[];
}

export function ProvenanceViewer({
  sourceOrigin = "Arctic Shift",
  sourceId,
  capturedUtc,
  status,
  history = [],
}: ProvenanceViewerProps) {
  const [showTechnical, setShowTechnical] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number>(
    history.length > 0 ? history[history.length - 1].version : 1
  );

  const hasMultipleRevisions = history.length > 1;
  const currentObserved = history.find((h) => h.version === selectedVersion) || history[0];

  return (
    <div className="space-y-3 pt-2">
      {/* Summary Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-surface-container rounded-xl border border-outline/40 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-on-surface-variant">Status:</span>
          <StatusBadge status={status} size="sm" />
        </div>
        <div className="text-on-surface-variant flex items-center gap-1.5">
          <span>Captured:</span>
          <span className="text-on-surface font-medium">
            {capturedUtc ? new Date(capturedUtc).toLocaleDateString() : "Historical"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowTechnical(!showTechnical)}
          className="text-primary hover:underline flex items-center gap-1 font-medium ml-auto text-xs"
        >
          <span>{showTechnical ? "Hide technical details" : "Technical details"}</span>
          <span className="material-symbols-outlined text-[14px]">
            {showTechnical ? "expand_less" : "expand_more"}
          </span>
        </button>
      </div>

      {/* Collapsible Technical Metadata */}
      {showTechnical && (
        <div className="p-4 bg-surface-container rounded-xl border border-outline/50 text-xs space-y-3 animate-in fade-in duration-150">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-on-surface-variant block text-[11px]">Source</span>
              <span className="text-on-surface font-medium">{sourceOrigin}</span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[11px]">Reddit ID</span>
              <span className="font-mono text-on-surface text-[11px]">{sourceId}</span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[11px]">Exact Captured Time</span>
              <span className="text-on-surface text-[11px]">
                {capturedUtc ? new Date(capturedUtc).toLocaleString() : "Unknown"}
              </span>
            </div>
          </div>

          {/* Revisions & Diff */}
          {hasMultipleRevisions ? (
            <div className="space-y-2 pt-2 border-t border-outline/30">
              <div className="flex items-center justify-between">
                <span className="font-medium text-on-surface">Revision History ({history.length})</span>
                <div className="flex gap-1">
                  {history.map((rev) => (
                    <button
                      key={rev.version}
                      type="button"
                      onClick={() => setSelectedVersion(rev.version)}
                      className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedVersion === rev.version
                          ? "bg-primary text-white"
                          : "bg-surface text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      v{rev.version}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-surface rounded-lg border border-outline/30 space-y-1">
                <div className="text-[11px] text-on-surface-variant flex justify-between">
                  <span>{new Date(currentObserved.recordedAt).toLocaleString()}</span>
                  <StatusBadge status={currentObserved.status} size="sm" />
                </div>
                <p className="text-xs text-on-surface whitespace-pre-wrap">
                  {currentObserved.content || "(No text recorded)"}
                </p>
                {currentObserved.diffPatch && (
                  <pre className="mt-2 p-2 bg-surface-container-lowest rounded text-[11px] font-mono text-on-surface-variant overflow-x-auto">
                    {currentObserved.diffPatch}
                  </pre>
                )}
              </div>
            </div>
          ) : (
            <div className="text-on-surface-variant text-[11px] italic pt-1">
              No previous revision history available. (Single archival snapshot).
            </div>
          )}
        </div>
      )}
    </div>
  );
}
