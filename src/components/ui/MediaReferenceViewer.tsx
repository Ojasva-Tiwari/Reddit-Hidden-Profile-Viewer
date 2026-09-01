"use client";

import React, { useState } from "react";
import { MediaStatus } from "@/types";
import { MediaStatusBadge } from "./MediaStatusBadge";

interface MediaReference {
  mediaUrl: string;
  thumbnailUrl?: string | null;
  archiveUrl?: string | null;
  mediaType?: string | null;
  status: MediaStatus;
}

interface MediaReferenceViewerProps {
  mediaStatus?: MediaStatus;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  references?: MediaReference[];
}

export function MediaReferenceViewer({
  mediaStatus = "MEDIA_UNAVAILABLE",
  mediaUrl,
  thumbnailUrl,
  references = [],
}: MediaReferenceViewerProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const primaryRef = references[0];
  const activeUrl = primaryRef?.mediaUrl || mediaUrl;
  const activeThumb = primaryRef?.thumbnailUrl || thumbnailUrl;
  const activeStatus = primaryRef?.status || mediaStatus;

  if (activeStatus === "MEDIA_UNAVAILABLE" && !activeUrl && !activeThumb) {
    return null;
  }

  const imageSrc = activeUrl || activeThumb;

  return (
    <div className="space-y-2 mt-3">
      {activeStatus === "MEDIA_AVAILABLE" && imageSrc ? (
        <div className="space-y-2">
          {/* Large Image Preview Card */}
          <div
            onClick={() => setLightboxOpen(true)}
            className="group relative max-h-96 w-full overflow-hidden rounded-2xl border border-outline/50 bg-surface-container flex items-center justify-center cursor-zoom-in transition-all duration-200 hover:border-outline"
          >
            <img
              src={imageSrc}
              alt="Media Preview"
              className="max-h-96 w-auto max-w-full object-contain rounded-xl transition-transform duration-200 group-hover:scale-[1.01]"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium shadow-md">
                <span className="material-symbols-outlined text-[16px]">fullscreen</span>
                Click to expand
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-on-surface-variant px-1">
            <MediaStatusBadge status={activeStatus} size="sm" />
            {activeUrl && (
              <a
                href={activeUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                <span>Original link</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </a>
            )}
          </div>
        </div>
      ) : activeStatus === "THUMBNAIL_AVAILABLE" && activeThumb ? (
        <div className="flex items-center gap-4 p-3 bg-surface-container rounded-2xl border border-outline/40">
          <img
            src={activeThumb}
            alt="Thumbnail"
            onClick={() => setLightboxOpen(true)}
            className="w-20 h-20 object-cover rounded-xl border border-outline/40 bg-surface cursor-zoom-in flex-shrink-0"
          />
          <div className="space-y-1 flex-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-on-surface">Archived Thumbnail</span>
              <MediaStatusBadge status={activeStatus} size="sm" />
            </div>
            <p className="text-xs text-on-surface-variant">
              Low-resolution thumbnail preserved in archive.
            </p>
            {activeUrl && (
              <a
                href={activeUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>Source link</span>
                <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </a>
            )}
          </div>
        </div>
      ) : activeStatus === "MEDIA_REFERENCE_ONLY" && activeUrl ? (
        <div className="p-3.5 bg-surface-container rounded-2xl border border-outline/40 text-sm space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-on-surface font-medium">
              <span className="material-symbols-outlined text-[18px] text-primary">link</span>
              <span>External Media Link</span>
            </div>
            <MediaStatusBadge status={activeStatus} size="sm" />
          </div>
          <p className="text-xs text-on-surface-variant">
            Referenced external host: <span className="font-mono text-on-surface">{activeUrl}</span>
          </p>
        </div>
      ) : null}

      {/* Lightbox Modal */}
      {lightboxOpen && imageSrc && (
        <div
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            <img
              src={imageSrc}
              alt="Fullscreen Preview"
              className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-12 right-0 text-white/80 hover:text-white flex items-center gap-1 text-sm bg-white/10 hover:bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
