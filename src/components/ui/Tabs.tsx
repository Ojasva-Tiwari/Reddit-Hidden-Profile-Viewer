import React from "react";
import { clsx } from "clsx";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={clsx("flex items-center gap-xs border-b border-outline overflow-x-auto", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              "flex items-center gap-xs px-md py-xs font-label-caps text-label-caps whitespace-nowrap transition-colors relative border-b-2 -mb-[1px]",
              isActive
                ? "border-secondary text-on-surface font-semibold"
                : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant"
            )}
          >
            {tab.icon && (
              <span className="material-symbols-outlined text-[16px]" data-icon={tab.icon}>
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={clsx(
                  "font-code text-[10px] px-[5px] py-[1px] rounded-sm",
                  isActive ? "bg-secondary/20 text-secondary" : "bg-surface-container-highest text-on-surface-variant"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
