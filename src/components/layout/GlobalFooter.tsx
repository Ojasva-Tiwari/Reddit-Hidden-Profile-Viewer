import React from "react";
import Link from "next/link";

export function GlobalFooter({ className }: { className?: string }) {
  return (
    <footer className={`w-full py-md px-gutter border-t border-outline bg-surface-container-lowest text-on-surface-variant font-code text-code select-none ${className || ""}`}>
      <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-sm text-[12px]">
        <div className="flex items-center gap-xs">
          <span>Made by</span>
          <span className="text-on-surface font-medium">Ojasva Tiwari</span>
        </div>

        <div className="flex items-center gap-md">
          <Link
            href="https://github.com/Ojasva-Tiwari/Reddit-Hidden-Profile-Viewer"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-xs hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]" data-icon="terminal">
              terminal
            </span>
            <span>GitHub Repository</span>
          </Link>
          <span className="text-outline">|</span>
          <span className="text-on-surface-variant/60">Forensic Archive v1.0</span>
        </div>
      </div>
    </footer>
  );
}
