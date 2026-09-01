"use client";

import React from "react";
import { useTheme, Theme } from "@/lib/theme";
import { clsx } from "clsx";

export function ThemeSelector({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={clsx(
        "flex items-center gap-1 bg-surface-container border border-outline rounded-full p-1 shadow-sm",
        className
      )}
    >
      {/* Dark Mode */}
      <button
        onClick={() => setTheme("dark")}
        title="Dark mode"
        className={clsx(
          "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200",
          theme === "dark"
            ? "bg-primary text-white shadow-xs"
            : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
        )}
      >
        <span className="material-symbols-outlined text-[16px]">dark_mode</span>
      </button>

      {/* Light Mode */}
      <button
        onClick={() => setTheme("light")}
        title="Light mode"
        className={clsx(
          "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200",
          theme === "light"
            ? "bg-primary text-white shadow-xs"
            : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
        )}
      >
        <span className="material-symbols-outlined text-[16px]">light_mode</span>
      </button>

      {/* AMOLED Mode */}
      <button
        onClick={() => setTheme("amoled")}
        title="AMOLED black mode"
        className={clsx(
          "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200",
          theme === "amoled"
            ? "bg-primary text-white shadow-xs"
            : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
        )}
      >
        <span className="w-3.5 h-3.5 rounded-full border-2 border-current" />
      </button>
    </div>
  );
}
