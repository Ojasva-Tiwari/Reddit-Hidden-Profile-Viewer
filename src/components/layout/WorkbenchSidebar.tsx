"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

interface WorkbenchSidebarProps {
  username: string;
}

export function WorkbenchSidebar({ username }: WorkbenchSidebarProps) {
  const pathname = usePathname();
  const basePath = `/u/${encodeURIComponent(username)}`;
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const navItems = [
    { label: "Overview", href: basePath, icon: "account_circle", exact: true },
    { label: "Posts", href: `${basePath}/posts`, icon: "article", exact: false },
    { label: "Comments", href: `${basePath}/comments`, icon: "forum", exact: false },
    { label: "Activity", href: `${basePath}/activity`, icon: "analytics", exact: false },
    { label: "Timeline", href: `${basePath}/timeline`, icon: "timeline", exact: false },
    { label: "AI Summary", href: `${basePath}/ai-summary`, icon: "auto_awesome", exact: false },
  ];

  const handleExport = (format: "json" | "csv") => {
    window.open(`/api/profile/${encodeURIComponent(username)}/export?format=${format}`, "_blank");
    setExportMenuOpen(false);
  };

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

      {/* Historical Disclaimer & Export Action */}
      <div className="px-md mt-auto pt-sm border-t border-outline space-y-xs">
        <div className="p-xs bg-surface-container-lowest border border-outline rounded-sm font-code text-[10px] text-on-surface-variant leading-normal">
          Coverage is historical. Missing records do not imply non-existence.
        </div>

        <div className="relative">
          {exportMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-xs bg-surface-container-highest border border-outline rounded-sm p-xs space-y-xs shadow-lg">
              <button
                type="button"
                onClick={() => handleExport("json")}
                className="w-full text-left font-code text-[11px] p-xs hover:bg-surface-container-high rounded-sm text-on-surface flex items-center justify-between"
              >
                <span>Export as JSON (.json)</span>
                <span className="text-secondary">RAW</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport("csv")}
                className="w-full text-left font-code text-[11px] p-xs hover:bg-surface-container-high rounded-sm text-on-surface flex items-center justify-between"
              >
                <span>Export as CSV (.csv)</span>
                <span className="text-primary">TABLE</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setExportMenuOpen((prev) => !prev)}
            className="w-full bg-surface-container-high border border-outline text-on-surface hover:border-outline-variant hover:bg-surface-container-highest font-label-caps text-label-caps py-xs px-md rounded-sm transition-colors text-center flex items-center justify-center gap-xs"
          >
            <span className="material-symbols-outlined text-[16px]" data-icon="download">
              download
            </span>
            <span>EXPORT ARCHIVE DATA</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
