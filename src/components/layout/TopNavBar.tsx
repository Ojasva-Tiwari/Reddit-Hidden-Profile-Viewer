"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ThemeSelector } from "@/components/ui/ThemeSelector";

export function TopNavBar() {
  const router = useRouter();
  const [searchUser, setSearchUser] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchUser.trim()) {
      router.push(`/u/${encodeURIComponent(searchUser.trim().replace(/^u\//i, ""))}`);
    }
  };

  return (
    <header className="sticky top-0 left-0 right-0 w-full z-40 bg-background/85 backdrop-blur-md border-b border-outline/50 h-16 flex items-center justify-between px-4 sm:px-8 select-none transition-colors">
      {/* Brand with Small Mascot Logo */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105">
            <Image
              src="/mascot.png"
              alt="Reddit Profile Mascot"
              width={32}
              height={32}
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-semibold text-base sm:text-lg text-on-surface tracking-tight">
            Profile Viewer
          </span>
        </Link>
      </div>

      {/* Quick Search in Header (when not on homepage) */}
      <div className="hidden md:flex items-center flex-1 max-w-sm mx-8">
        <form onSubmit={handleSearch} className="w-full relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            placeholder="Search Reddit username..."
            className="w-full bg-surface-container text-on-surface placeholder:text-on-surface-variant/60 border border-outline/60 rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </form>
      </div>

      {/* Theme Switcher & GitHub */}
      <div className="flex items-center gap-3">
        <ThemeSelector />

        <Link
          href="https://github.com/Ojasva-Tiwari/Reddit-Hidden-Profile-Viewer"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub Repository"
          className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">code</span>
        </Link>
      </div>
    </header>
  );
}
