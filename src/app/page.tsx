"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";

export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      router.push(`/u/${encodeURIComponent(username.trim().replace(/^u\//i, ""))}`);
    }
  };

  const handleQuickLookup = (name: string) => {
    router.push(`/u/${encodeURIComponent(name)}`);
  };

  return (
    <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 max-w-5xl mx-auto w-full py-12 sm:py-20 relative">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto space-y-4 pt-6 sm:pt-10">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-on-surface">
          Look up a Reddit profile
        </h1>
        <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed">
          Enter a username and get a clean profile page with its posts, comments and history —
          including content that has since disappeared.
        </p>
      </div>

      {/* Search Bar Container */}
      <div className="w-full max-w-xl mx-auto mt-8 mb-16 space-y-3">
        <form
          onSubmit={handleSearch}
          className="relative flex items-center bg-surface border border-outline rounded-full p-1.5 shadow-card hover:border-outline-variant focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200"
        >
          <div className="pl-4 text-on-surface-variant flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-[22px]">search</span>
          </div>

          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            autoFocus
            className="w-full bg-transparent text-on-surface placeholder:text-on-surface-variant/50 px-3 py-2 text-base focus:outline-none border-none ring-0"
          />

          <button
            type="submit"
            disabled={!username.trim()}
            className="bg-primary hover:bg-primary-container text-white font-medium px-6 py-2.5 rounded-full text-sm shadow-sm transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            View
          </button>
        </form>

        {/* Quick link */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-on-surface-variant">
          <span>Try</span>
          <button
            type="button"
            onClick={() => handleQuickLookup("mossyroute")}
            className="text-primary hover:underline font-medium"
          >
            u/mossyroute
          </button>
        </div>
      </div>

      {/* 3 Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mx-auto">
        {/* Card 1: Full history */}
        <Card level={1} density="normal" className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[22px]">schedule</span>
          </div>
          <h3 className="text-base font-semibold text-on-surface">Full history</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Posts and comments grouped by year and month, including ones that no longer show on the
            profile.
          </p>
        </Card>

        {/* Card 2: Media, properly sized */}
        <Card level={1} density="normal" className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[22px]">image</span>
          </div>
          <h3 className="text-base font-semibold text-on-surface">Media, properly sized</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Image posts get a large preview and a clean lightbox instead of a thumbnail.
          </p>
        </Card>

        {/* Card 3: Simple insights */}
        <Card level={1} density="normal" className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
          </div>
          <h3 className="text-base font-semibold text-on-surface">Simple insights</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Thirty short, readable findings about how someone uses Reddit — each with evidence.
          </p>
        </Card>
      </div>
    </main>
  );
}
