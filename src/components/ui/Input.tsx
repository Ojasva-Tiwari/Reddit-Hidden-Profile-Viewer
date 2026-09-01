import React from "react";
import { clsx } from "clsx";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: string;
  isMonospace?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, isMonospace = false, type = "text", ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <span className="material-symbols-outlined absolute left-3.5 text-[18px] text-on-surface-variant pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          className={clsx(
            "w-full bg-surface text-on-surface placeholder:text-on-surface-variant/50 border border-outline/50 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-150",
            icon && "pl-10",
            isMonospace ? "font-mono text-xs" : "font-sans",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";
