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

  if (normalized === "MEDIA_UNAVAILABLE") return null;

  const getStatusStyles = () => {
    switch (normalized) {
      case "MEDIA_AVAILABLE":
      case "ARCHIVED_COPY":
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "THUMBNAIL_AVAILABLE":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "MEDIA_REFERENCE_ONLY":
      default:
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    }
  };

  const getLabel = () => {
    switch (normalized) {
      case "MEDIA_AVAILABLE":
      case "ARCHIVED_COPY":
        return "image preview";
      case "THUMBNAIL_AVAILABLE":
        return "thumbnail";
      case "MEDIA_REFERENCE_ONLY":
      default:
        return "external link";
    }
  };

  const sizeStyles = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 font-medium rounded-full border transition-colors",
        getStatusStyles(),
        sizeStyles,
        className
      )}
    >
      <span className="material-symbols-outlined text-[13px]">
        {normalized === "MEDIA_AVAILABLE" || normalized === "ARCHIVED_COPY"
          ? "image"
          : normalized === "THUMBNAIL_AVAILABLE"
          ? "photo_size_select_actual"
          : "link"}
      </span>
      <span>{getLabel()}</span>
    </span>
  );
}
