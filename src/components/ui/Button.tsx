import React from "react";
import { clsx } from "clsx";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: string;
  iconPosition?: "left" | "right";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "ghost", size = "md", icon, iconPosition = "left", children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-label-caps text-label-caps transition-colors duration-150 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed select-none focus:outline-none focus:ring-1 focus:ring-secondary";

    const variantStyles = {
      primary: "bg-primary-container text-on-primary-container hover:bg-inverse-primary hover:text-on-primary border border-transparent active:opacity-90 font-medium",
      ghost: "bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-transparent",
      secondary: "bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline",
      outline: "bg-transparent text-on-surface hover:bg-surface-container-high border border-outline hover:border-outline-variant",
      danger: "bg-error-container text-on-error-container hover:bg-error hover:text-on-error border border-transparent",
    };

    const sizeStyles = {
      sm: "px-sm py-[2px] gap-xs text-[10px]",
      md: "px-md py-xs gap-sm text-label-caps",
      lg: "px-lg py-sm gap-sm text-body-base",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {icon && iconPosition === "left" && (
          <span className="material-symbols-outlined text-[16px]" data-icon={icon}>
            {icon}
          </span>
        )}
        {children}
        {icon && iconPosition === "right" && (
          <span className="material-symbols-outlined text-[16px]" data-icon={icon}>
            {icon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
