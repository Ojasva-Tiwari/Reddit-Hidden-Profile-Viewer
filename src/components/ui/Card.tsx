import React from "react";
import { clsx } from "clsx";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: 0 | 1 | 2;
  density?: "compact" | "normal" | "spacious";
  hoverable?: boolean;
}

export function Card({
  className,
  level = 1,
  density = "normal",
  hoverable = false,
  children,
  ...props
}: CardProps) {
  const levelStyles = {
    0: "bg-surface border border-outline/50 shadow-card",
    1: "bg-surface-container-low border border-outline/60 shadow-card",
    2: "bg-surface-container border border-outline/40 shadow-sm",
  };

  const densityStyles = {
    compact: "p-3 sm:p-4",
    normal: "p-5 sm:p-6",
    spacious: "p-6 sm:p-8",
  };

  return (
    <div
      className={clsx(
        "rounded-2xl transition-all duration-200",
        levelStyles[level],
        densityStyles[density],
        hoverable && "hover:border-outline hover:shadow-card-hover cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
