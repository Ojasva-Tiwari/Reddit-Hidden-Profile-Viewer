import React from "react";
import { clsx } from "clsx";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: string;
  isMonospace?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, icon, isMonospace = true, children, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        {icon && (
          <span className="material-symbols-outlined absolute left-sm text-[16px] text-on-surface-variant pointer-events-none" data-icon={icon}>
            {icon}
          </span>
        )}
        <select
          ref={ref}
          className={clsx(
            "bg-surface-container-lowest text-on-surface border border-outline rounded-sm py-xs px-sm pr-8 appearance-none focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors cursor-pointer",
            icon && "pl-[30px]",
            isMonospace ? "font-code text-code" : "font-body-base text-body-base",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <span className="material-symbols-outlined absolute right-xs text-[18px] text-on-surface-variant pointer-events-none" data-icon="arrow_drop_down">
          arrow_drop_down
        </span>
      </div>
    );
  }
);

Select.displayName = "Select";
