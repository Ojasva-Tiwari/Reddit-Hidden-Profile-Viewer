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
  const normalized = status.toUpperCase();

  const getStatusStyles = () => {
    switch (normalized) {
      case "VISIBLE":
        return "text-[#3fb950] bg-[#3fb950]/15 border-[#3fb950]/30";
      case "DELETED":
        return "text-[#ffb4ab] bg-[#ffb4ab]/15 border-[#ffb4ab]/30";
      case "REMOVED":
        return "text-[#d29922] bg-[#d29922]/15 border-[#d29922]/30";
      case "EDITED":
        return "text-[#58a6ff] bg-[#58a6ff]/15 border-[#58a6ff]/30";
      case "DELETED_LATER":
        return "text-[#ff7b72] bg-[#ff7b72]/15 border-[#ff7b72]/30";
      case "INITIALLY_UNAVAILABLE":
      default:
        return "text-[#bec7d2] bg-[#bec7d2]/15 border-[#bec7d2]/30";
    }
  };

  const sizeStyles = size === "sm" ? "px-[6px] py-[1px] text-[10px]" : "px-sm py-[2px] text-label-caps";

  return (
    <span
      className={clsx(
        "inline-flex items-center font-label-caps uppercase tracking-wider rounded-full border",
        getStatusStyles(),
        sizeStyles,
        className
      )}
    >
      {normalized.replace("_", " ")}
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
        return "text-[#3fb950] border-[#3fb950]/40 bg-[#3fb950]/10";
      case "MEDIUM":
        return "text-[#d29922] border-[#d29922]/40 bg-[#d29922]/10";
      case "SPECULATIVE":
        return "text-[#bec7d2] border-[#bec7d2]/40 bg-[#bec7d2]/10";
    }
  };

  return (
    <span className={clsx("font-label-caps text-[10px] px-sm py-[2px] rounded-sm border uppercase", getStyles(), className)}>
      {confidence} CONFIDENCE
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
        return "text-primary border-primary/40 bg-primary/10";
      case "STRONGLY_SUPPORTED":
        return "text-secondary border-secondary/40 bg-secondary/10";
      case "WEAK_INFERENCE":
        return "text-on-surface-variant border-outline bg-surface-container-high";
    }
  };

  return (
    <span className={clsx("font-label-caps text-[10px] px-sm py-[2px] rounded-sm border uppercase", getStyles(), className)}>
      {classification.replace("_", " ")}
    </span>
  );
}
