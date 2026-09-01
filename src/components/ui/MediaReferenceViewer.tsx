import React from "react";
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
  const primaryRef = references[0];
  const activeUrl = primaryRef?.mediaUrl || mediaUrl;
  const activeThumb = primaryRef?.thumbnailUrl || thumbnailUrl;
  const activeStatus = primaryRef?.status || mediaStatus;

  return (
    <div className="space-y-xs">
      <div className="flex items-center justify-between">
        <h4 className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-xs">
          <span className="material-symbols-outlined text-[16px] text-secondary" data-icon="perm_media">
            perm_media
          </span>
          <span>ATTACHED MEDIA & REFERENCES</span>
        </h4>
        <MediaStatusBadge status={activeStatus} size="sm" />
      </div>

      <div className="p-md bg-surface-container-lowest border border-outline rounded-sm font-code text-code text-[12px]">
        {activeStatus === "MEDIA_AVAILABLE" && (activeUrl || activeThumb) ? (
          <div className="space-y-sm">
            <div className="relative max-h-80 overflow-hidden rounded-sm border border-outline bg-[#000000] flex items-center justify-center">
              <img
                src={activeUrl || activeThumb || ""}
                alt="Archived Media Content"
                className="max-h-80 w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-between text-on-surface-variant text-[11px]">
              <span>Type: {primaryRef?.mediaType || "IMAGE/PREVIEW"}</span>
              <a
                href={activeUrl || "#"}
                target="_blank"
                rel="noreferrer noopener"
                className="text-secondary hover:underline flex items-center gap-[2px]"
              >
                <span>OPEN DIRECT SOURCE</span>
                <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </a>
            </div>
          </div>
        ) : activeStatus === "THUMBNAIL_AVAILABLE" && activeThumb ? (
          <div className="flex items-start gap-md">
            <img
              src={activeThumb}
              alt="Archived Thumbnail"
              className="w-24 h-24 object-cover rounded-sm border border-outline bg-surface-container flex-shrink-0"
            />
            <div className="space-y-xs flex-1">
              <span className="text-secondary font-semibold block">Thumbnail Preserved in Archive</span>
              <p className="font-body-dense text-[12px] text-on-surface-variant">
                The original full-resolution media was not captured during ingestion, but a low-resolution thumbnail was preserved in upstream metadata.
              </p>
              {activeUrl && (
                <div className="text-[11px] text-on-surface-variant truncate max-w-md">
                  Original Reference: <span className="text-primary">{activeUrl}</span>
                </div>
              )}
            </div>
          </div>
        ) : activeStatus === "MEDIA_REFERENCE_ONLY" ? (
          <div className="space-y-xs">
            <div className="flex items-center gap-xs text-[#58a6ff]">
              <span className="material-symbols-outlined text-[16px]">link</span>
              <span className="font-semibold">External Media Reference Detected</span>
            </div>
            <p className="font-body-dense text-[12px] text-on-surface-variant">
              The original submission referenced an external URL, but raw media files are not mirrored or stored in this historical archive database.
            </p>
            {activeUrl && (
              <div className="p-xs px-sm bg-surface-container border border-outline rounded-sm truncate text-on-surface">
                Target URL: <span className="text-primary">{activeUrl}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-on-surface-variant/70 italic flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">hide_image</span>
            <span>No media attachments or external media references associated with this record.</span>
          </div>
        )}
      </div>
    </div>
  );
}
