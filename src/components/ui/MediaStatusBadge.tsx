import React from "react";
import { clsx } from "clsx";
import { MediaStatus } from "@/types";

interface MediaStatusBadgeProps {
  status: MediaStatus | string;
  className?: string;
  size?: "sm" | "md";
}

export function MediaStatusBadge({ status, className, size = "md" }: MediaStatusBadgeProps) {
  const normalized = (status || "MEDIA_UNAVAILABLE").toUpperCase() as MediaStatus;

  const getStatusStyles = () => {
    switch (normalized) {
      case "MEDIA_AVAILABLE":
        return "text-[#3fb950] bg-[#3fb950]/15 border-[#3fb950]/30";
      case "ARCHIVED_COPY":
        return "text-secondary bg-secondary/15 border-secondary/30";
      case "THUMBNAIL_AVAILABLE":
        return "text-[#d29922] bg-[#d29922]/15 border-[#d29922]/30";
      case "MEDIA_REFERENCE_ONLY":
        return "text-[#58a6ff] bg-[#58a6ff]/15 border-[#58a6ff]/30";
      case "MEDIA_UNAVAILABLE":
      default:
        return "text-on-surface-variant/60 bg-surface-container-high border-outline/40";
    }
  };

  const getLabel = () => {
    switch (normalized) {
      case "MEDIA_AVAILABLE":
        return "MEDIA AVAILABLE";
      case "ARCHIVED_COPY":
        return "ARCHIVED COPY";
      case "THUMBNAIL_AVAILABLE":
        return "THUMBNAIL ONLY";
      case "MEDIA_REFERENCE_ONLY":
        return "MEDIA REF ONLY";
      case "MEDIA_UNAVAILABLE":
      default:
        return "NO MEDIA";
    }
  };

  const sizeStyles = size === "sm" ? "px-[6px] py-[1px] text-[9px]" : "px-sm py-[2px] text-label-caps";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-[4px] font-label-caps uppercase tracking-wider rounded-sm border",
        getStatusStyles(),
        sizeStyles,
        className
      )}
    >
      <span className="material-symbols-outlined text-[12px]">
        {normalized === "MEDIA_AVAILABLE" || normalized === "ARCHIVED_COPY"
          ? "photo_library"
          : normalized === "THUMBNAIL_AVAILABLE"
          ? "image"
          : normalized === "MEDIA_REFERENCE_ONLY"
          ? "link"
          : "hide_image"}
      </span>
      <span>{getLabel()}</span>
    </span>
  );
}
