import React from "react";
import { clsx } from "clsx";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: string;
  isMonospace?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, icon, isMonospace = false, children, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        {icon && (
          <span className="material-symbols-outlined absolute left-3.5 text-[16px] text-on-surface-variant pointer-events-none">
            {icon}
          </span>
        )}
        <select
          ref={ref}
          className={clsx(
            "bg-surface text-on-surface border border-outline/50 rounded-xl py-2 px-3 pr-8 text-sm appearance-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-150 cursor-pointer",
            icon && "pl-9",
            isMonospace ? "font-mono text-xs" : "font-sans",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <span className="material-symbols-outlined absolute right-2.5 text-[18px] text-on-surface-variant pointer-events-none">
          arrow_drop_down
        </span>
      </div>
    );
  }
);

Select.displayName = "Select";
