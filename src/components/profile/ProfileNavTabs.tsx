"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

export function ProfileNavTabs({ username }: { username: string }) {
  const pathname = usePathname();

  const tabs = [
    { label: "Posts", href: `/u/${username}/posts` },
    { label: "Comments", href: `/u/${username}/comments` },
    { label: "Activity", href: `/u/${username}/activity` },
    { label: "History", href: `/u/${username}/timeline` },
    { label: "Insights", href: `/u/${username}/ai-summary` },
  ];

  return (
    <nav className="flex items-center gap-1.5 overflow-x-auto py-2 border-b border-outline/40 scrollbar-none">
      {tabs.map((tab) => {
        const isActive =
          pathname === tab.href ||
          (tab.label === "Posts" && pathname === `/u/${username}`);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 whitespace-nowrap",
              isActive
                ? "bg-primary text-white shadow-xs font-semibold"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
