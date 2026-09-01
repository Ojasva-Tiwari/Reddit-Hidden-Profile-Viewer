import React from "react";
import { clsx } from "clsx";

export type ContentStatusType =
  | "VISIBLE"
  | "DELETED"
  | "REMOVED"
  | "EDITED"
  | "DELETED_LATER"
  | "INITIALLY_UNAVAILABLE";

export type AIClassificationType =
  | "EXPLICIT"
  | "STRONGLY_SUPPORTED"
  | "WEAK_INFERENCE";

export type ConfidenceType = "HIGH" | "MEDIUM" | "SPECULATIVE";

interface StatusBadgeProps {
  status: ContentStatusType | string;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, className, size = "md" }: StatusBadgeProps) {
  const normalized = (status || "VISIBLE").toUpperCase();

  const getStatusStyles = () => {
    switch (normalized) {
      case "VISIBLE":
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "DELETED":
        return "text-rose-500 bg-rose-500/10 border-rose-500/20";
      case "REMOVED":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "EDITED":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "DELETED_LATER":
        return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "INITIALLY_UNAVAILABLE":
      default:
        return "text-zinc-400 bg-zinc-500/10 border-zinc-500/20";
    }
  };

  const sizeStyles = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={clsx(
        "inline-flex items-center font-medium rounded-full border transition-colors",
        getStatusStyles(),
        sizeStyles,
        className
      )}
    >
      {normalized.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}

interface ConfidenceBadgeProps {
  confidence: ConfidenceType;
  className?: string;
}

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  const getStyles = () => {
    switch (confidence) {
      case "HIGH":
        return "text-emerald-500 border-emerald-500/20 bg-emerald-500/10";
      case "MEDIUM":
        return "text-amber-500 border-amber-500/20 bg-amber-500/10";
      case "SPECULATIVE":
        return "text-zinc-400 border-zinc-500/20 bg-zinc-500/10";
    }
  };

  return (
    <span
      className={clsx(
        "font-medium text-[11px] px-2.5 py-0.5 rounded-full border",
        getStyles(),
        className
      )}
    >
      {confidence.toLowerCase()} confidence
    </span>
  );
}

interface ClassificationBadgeProps {
  classification: AIClassificationType;
  className?: string;
}

export function ClassificationBadge({ classification, className }: ClassificationBadgeProps) {
  const getStyles = () => {
    switch (classification) {
      case "EXPLICIT":
        return "text-primary border-primary/20 bg-primary/10";
      case "STRONGLY_SUPPORTED":
        return "text-blue-500 border-blue-500/20 bg-blue-500/10";
      case "WEAK_INFERENCE":
        return "text-on-surface-variant border-outline bg-surface-container";
    }
  };

  return (
    <span
      className={clsx(
        "font-medium text-[11px] px-2.5 py-0.5 rounded-full border",
        getStyles(),
        className
      )}
    >
      {classification.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}
