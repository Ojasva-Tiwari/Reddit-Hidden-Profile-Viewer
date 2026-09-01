"use client";

import React from "react";
import Link from "next/link";

export function GlobalFooter() {
  return (
    <footer className="w-full border-t border-outline/40 py-8 px-4 sm:px-8 mt-auto bg-background/50 transition-colors">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
        <div className="flex items-center gap-1.5">
          <span>Made by</span>
          <span className="text-on-surface font-medium">Ojasva Tiwari</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="https://github.com/Ojasva-Tiwari/Reddit-Hidden-Profile-Viewer"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">code</span>
            <span>GitHub</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
