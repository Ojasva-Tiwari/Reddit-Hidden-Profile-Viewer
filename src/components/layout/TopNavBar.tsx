"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeSelector } from "@/components/ui/ThemeSelector";

export function TopNavBar() {
  const router = useRouter();
  const [searchUser, setSearchUser] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchUser.trim()) {
      router.push(`/u/${encodeURIComponent(searchUser.trim().replace(/^u\//, ""))}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface border-b border-outline h-12 flex items-center justify-between px-gutter select-none">
      {/* Brand & Terminal Identifier */}
      <div className="flex items-center gap-md">
        <Link href="/" className="flex items-center gap-xs group">
          <span className="font-label-caps text-label-caps tracking-widest text-primary font-bold group-hover:opacity-80 transition-opacity">
            OSINT_ARCHIVE
          </span>
          <span className="font-code text-[10px] text-on-surface-variant/70 border border-outline px-[4px] py-[1px] rounded-sm hidden sm:inline">
            v1.0-FORENSIC
          </span>
        </Link>
      </div>

      {/* Quick Search in Header */}
      <div className="hidden md:flex items-center flex-1 max-w-xs mx-md">
        <form onSubmit={handleSearch} className="w-full relative">
          <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant pointer-events-none" data-icon="search">
            search
          </span>
          <input
            type="text"
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            placeholder="Search Reddit username..."
            className="w-full bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 border border-outline rounded-sm py-[4px] pl-[30px] pr-sm text-code font-code text-[12px] focus:outline-none focus:border-secondary transition-colors"
          />
        </form>
      </div>

      {/* Utilities: Theme switcher, System status & Author avatar */}
      <div className="flex items-center gap-sm">
        <ThemeSelector />

        <Link
          href="https://github.com/Ojasva-Tiwari/Reddit-Hidden-Profile-Viewer"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub Repository"
          className="p-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-sm transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]" data-icon="code">
            code
          </span>
        </Link>

        {/* Researcher Indicator */}
        <div className="w-7 h-7 rounded-full bg-surface-container-high border border-outline flex items-center justify-center text-primary font-label-caps text-[11px] overflow-hidden ml-xs">
          <span className="material-symbols-outlined text-[18px]" data-icon="fingerprint">
            fingerprint
          </span>
        </div>
      </div>
    </header>
  );
}
