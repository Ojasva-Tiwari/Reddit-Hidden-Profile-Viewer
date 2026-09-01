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
    0: "bg-surface border border-outline",
    1: "bg-surface-container-low border border-outline",
    2: "bg-surface-container-lowest border border-outline",
  };

  const densityStyles = {
    compact: "p-sm",
    normal: "p-md",
    spacious: "p-lg md:p-xl",
  };

  return (
    <div
      className={clsx(
        "rounded-sm transition-colors duration-150",
        levelStyles[level],
        densityStyles[density],
        hoverable && "hover:border-outline-variant hover:bg-surface-container-high cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
