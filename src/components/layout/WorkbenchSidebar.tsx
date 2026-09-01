"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

interface WorkbenchSidebarProps {
  username: string;
}

export function WorkbenchSidebar({ username }: WorkbenchSidebarProps) {
  const pathname = usePathname();
  const basePath = `/u/${encodeURIComponent(username)}`;

  const navItems = [
    { label: "Overview", href: basePath, icon: "account_circle", exact: true },
    { label: "Posts", href: `${basePath}/posts`, icon: "article", exact: false },
    { label: "Comments", href: `${basePath}/comments`, icon: "forum", exact: false },
    { label: "Activity", href: `${basePath}/activity`, icon: "analytics", exact: false },
    { label: "Timeline", href: `${basePath}/timeline`, icon: "timeline", exact: false },
    { label: "AI Summary", href: `${basePath}/ai-summary`, icon: "auto_awesome", exact: false },
  ];

  return (
    <aside className="hidden md:flex flex-col bg-surface-container-low fixed left-0 top-12 h-[calc(100vh-48px)] w-[300px] border-r border-outline py-md z-40 select-none">
      {/* System Identification */}
      <div className="px-md pb-md border-b border-outline mb-sm">
        <div className="flex items-center gap-sm mb-xs">
          <span className="material-symbols-outlined text-[20px] text-primary" data-icon="inventory_2">
            inventory_2
          </span>
          <h2 className="font-label-caps text-label-caps text-on-surface font-bold">ARCHIVE_V1</h2>
        </div>
        <div className="flex items-center justify-between font-code text-code text-on-surface-variant">
          <span>TARGET: u/{username}</span>
          <span className="text-[10px] text-primary bg-primary/10 px-[4px] py-[1px] rounded-sm">ACTIVE</span>
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 flex flex-col gap-[2px] px-xs overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-sm px-sm py-xs transition-colors duration-150 rounded-sm font-body-dense text-body-dense cursor-pointer",
                isActive
                  ? "bg-secondary-container text-on-secondary-container font-medium border-r-2 border-secondary"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
              )}
            >
              <span className="material-symbols-outlined text-[18px]" data-icon={item.icon}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Export Action Card */}
      <div className="px-md mt-auto pt-sm border-t border-outline">
        <button
          onClick={() => alert(`[Export Placeholder] Preparing archival JSON/CSV package for u/${username}...`)}
          className="w-full bg-surface-container-high border border-outline text-on-surface hover:border-outline-variant hover:bg-surface-container-highest font-label-caps text-label-caps py-xs px-md rounded-sm transition-colors text-center flex items-center justify-center gap-xs"
        >
          <span className="material-symbols-outlined text-[16px]" data-icon="download">
            download
          </span>
          <span>EXPORT DATA</span>
        </button>
      </div>
    </aside>
  );
}
