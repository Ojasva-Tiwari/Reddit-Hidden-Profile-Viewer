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
  sourceOrigin = "ARCTIC_SHIFT",
  sourceId,
  capturedUtc,
  status,
  history = [],
}: ProvenanceViewerProps) {
  const [selectedVersion, setSelectedVersion] = useState<number>(history.length > 0 ? history[history.length - 1].version : 1);

  const hasMultipleRevisions = history.length > 1;
  const currentObserved = history.find((h) => h.version === selectedVersion) || history[0];

  return (
    <div className="space-y-md">
      {/* Forensic Provenance Metadata Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-xs p-sm bg-surface-container-lowest border border-outline rounded-sm font-code text-code text-[11px]">
        <div>
          <span className="text-on-surface-variant block text-[10px]">SOURCE DATASET</span>
          <span className="text-secondary font-bold truncate block">{sourceOrigin}</span>
        </div>
        <div>
          <span className="text-on-surface-variant block text-[10px]">SOURCE FULLNAME ID</span>
          <span className="text-primary font-bold truncate block">{sourceId}</span>
        </div>
        <div>
          <span className="text-on-surface-variant block text-[10px]">CAPTURED TIMESTAMP</span>
          <span className="text-on-surface truncate block">
            {capturedUtc ? new Date(capturedUtc).toLocaleString() : "Unknown"}
          </span>
        </div>
        <div>
          <span className="text-on-surface-variant block text-[10px]">HISTORICAL STATUS</span>
          <div className="mt-[2px]">
            <StatusBadge status={status} size="sm" />
          </div>
        </div>
      </div>

      {/* Revision Observations / Diff Section */}
      <div className="space-y-xs">
        <div className="flex items-center justify-between">
          <h4 className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px] text-secondary" data-icon="history">
              history
            </span>
            <span>OBSERVED REVISIONS & CONTENT SNAPSHOTS</span>
          </h4>
          {hasMultipleRevisions && (
            <span className="text-[11px] font-code text-secondary">
              {history.length} Revisions Recorded
            </span>
          )}
        </div>

        {hasMultipleRevisions ? (
          <div className="space-y-sm">
            {/* Version Selector Tabs */}
            <div className="flex items-center gap-xs border-b border-outline pb-xs">
              {history.map((rev) => (
                <button
                  key={rev.version}
                  type="button"
                  onClick={() => setSelectedVersion(rev.version)}
                  className={`px-sm py-[2px] rounded-sm font-code text-[11px] border transition-colors ${
                    selectedVersion === rev.version
                      ? "bg-secondary text-[#000000] font-bold border-secondary"
                      : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant border-outline"
                  }`}
                >
                  Version {rev.version} ({new Date(rev.recordedAt).toLocaleDateString()})
                </button>
              ))}
            </div>

            {/* Version Snapshot Content */}
            <div className="p-md bg-[#0D1117] border border-outline rounded-sm space-y-xs font-code text-code text-[12px]">
              <div className="flex items-center justify-between border-b border-outline/40 pb-xs text-[11px] text-on-surface-variant">
                <span>Recorded: {new Date(currentObserved.recordedAt).toLocaleString()}</span>
                <StatusBadge status={currentObserved.status} size="sm" />
              </div>
              <p className="font-body-base text-body-base text-on-surface whitespace-pre-wrap">
                {currentObserved.content || "(No textual content recorded)"}
              </p>
              {currentObserved.diffPatch && (
                <div className="mt-sm p-sm bg-[#161B22] border border-[#30363D] rounded-sm font-code text-[11px] text-on-surface-variant overflow-x-auto">
                  <span className="text-secondary block font-bold mb-xs">Diff Patch from Previous:</span>
                  <pre className="text-[11px]">{currentObserved.diffPatch}</pre>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-sm bg-surface-container-lowest border border-outline rounded-sm font-code text-code text-[11px] text-on-surface-variant/80 italic flex items-center gap-xs">
            <span className="material-symbols-outlined text-[14px]">info</span>
            <span>NO REVISION HISTORY AVAILABLE (Single point-in-time snapshot observed in archive)</span>
          </div>
        )}
      </div>
    </div>
  );
}
