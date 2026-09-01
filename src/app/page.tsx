"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      router.push(`/u/${encodeURIComponent(username.trim().replace(/^u\//, ""))}`);
    }
  };

  const sampleUsers = ["Speeder", "spez", "kn0thing", "automoderator"];

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-margin-mobile md:p-margin-desktop max-w-[1000px] mx-auto w-full py-xl">
      {/* Hero Badge */}
      <div className="flex items-center gap-xs px-sm py-[2px] bg-surface-container border border-outline rounded-full text-label-caps font-label-caps text-primary mb-lg">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span>HISTORICAL REDDIT PROFILE RESEARCH WORKBENCH</span>
      </div>

      {/* Terminal Title */}
      <h1 className="font-display-lg text-display-lg text-on-background text-center mb-xs tracking-tight">
        Reddit Hidden Profile Viewer
      </h1>
      <p className="font-body-base text-body-base text-on-surface-variant text-center max-w-xl mb-xl">
        Reconstruct removed submissions, deleted comment context, timeline evolution, and evidence-backed AI profile summaries.
      </p>

      {/* Primary Search Console */}
      <Card level={1} density="spacious" className="w-full max-w-xl mb-xl border-outline-variant">
        <form onSubmit={handleSearch} className="space-y-md">
          <div className="flex items-center justify-between font-label-caps text-label-caps text-on-surface-variant">
            <span>TARGET USERNAME LOOKUP</span>
            <span className="text-secondary font-code text-[11px]">STATUS: READY</span>
          </div>

          <div className="relative flex items-center">
            <span className="absolute left-md font-code text-code text-primary font-bold">
              u/
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="enter username..."
              autoFocus
              className="w-full bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40 border border-outline rounded-sm py-sm pl-10 pr-[100px] font-code text-code text-[14px] focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="absolute right-[4px]"
              disabled={!username.trim()}
            >
              INVESTIGATE
            </Button>
          </div>

          {/* Quick Demo Links */}
          <div className="flex flex-wrap items-center gap-xs pt-xs font-code text-code text-[12px] text-on-surface-variant">
            <span>Try sample profiles:</span>
            {sampleUsers.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => router.push(`/u/${u}`)}
                className="px-xs py-[2px] bg-surface-container-high hover:bg-surface-container-highest text-secondary border border-outline rounded-sm transition-colors"
              >
                u/{u}
              </button>
            ))}
          </div>
        </form>
      </Card>

      {/* Forensic Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md w-full max-w-4xl">
        <Card level={0} density="normal" className="space-y-xs">
          <div className="flex items-center gap-xs text-secondary font-label-caps text-label-caps">
            <span className="material-symbols-outlined text-[18px]" data-icon="history_toggle_off">
              history_toggle_off
            </span>
            <span>PHASE 1: PROVENANCE</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Historical Reconstruction</h3>
          <p className="font-body-dense text-body-dense text-on-surface-variant">
            Inspect original post bodies, detect moderator removals vs. author deletions, and view revision diffs.
          </p>
        </Card>

        <Card level={0} density="normal" className="space-y-xs">
          <div className="flex items-center gap-xs text-primary font-label-caps text-label-caps">
            <span className="material-symbols-outlined text-[18px]" data-icon="auto_awesome">
              auto_awesome
            </span>
            <span>PHASE 2: AI SUMMARY</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">30 Grounded Insights</h3>
          <p className="font-body-dense text-body-dense text-on-surface-variant">
            Deterministic behavioral profiling strictly backed by citations and explicit vs. inference classification.
          </p>
        </Card>

        <Card level={0} density="normal" className="space-y-xs">
          <div className="flex items-center gap-xs text-[#3fb950] font-label-caps text-label-caps">
            <span className="material-symbols-outlined text-[18px]" data-icon="terminal">
              terminal
            </span>
            <span>FORENSIC SYSTEM</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Triple Theme Engine</h3>
          <p className="font-body-dense text-body-dense text-on-surface-variant">
            Engineered for researchers with Dark mode, AMOLED pure black, and Archival Light mode.
          </p>
        </Card>
      </div>
    </main>
  );
}
