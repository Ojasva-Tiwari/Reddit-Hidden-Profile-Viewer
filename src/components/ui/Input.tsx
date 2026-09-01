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
          <span className="material-symbols-outlined absolute left-sm text-[18px] text-on-surface-variant pointer-events-none" data-icon={icon}>
            {icon}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          className={clsx(
            "w-full bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/60 border border-outline rounded-sm py-xs px-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors duration-150",
            icon && "pl-[32px]",
            isMonospace ? "font-code text-code" : "font-body-base text-body-base",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";
