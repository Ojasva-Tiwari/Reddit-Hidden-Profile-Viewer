"use client";

import React from "react";
import { useTheme, Theme } from "@/lib/theme";
import { clsx } from "clsx";

export function ThemeSelector({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const themes: { id: Theme; label: string; icon: string }[] = [
    { id: "dark", label: "Dark", icon: "dark_mode" },
    { id: "amoled", label: "AMOLED", icon: "contrast" },
    { id: "light", label: "Light", icon: "light_mode" },
  ];

  return (
    <div className={clsx("flex items-center bg-surface-container-lowest border border-outline rounded-sm p-[2px]", className)}>
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          title={`Switch to ${t.label} theme`}
          className={clsx(
            "flex items-center gap-xs px-sm py-[2px] rounded-sm font-label-caps text-[10px] uppercase transition-colors",
            theme === t.id
              ? "bg-surface-container-high text-primary font-semibold shadow-xs"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
          )}
        >
          <span className="material-symbols-outlined text-[14px]" data-icon={t.icon}>
            {t.icon}
          </span>
          <span className="hidden sm:inline">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
