import React from "react";
import { clsx } from "clsx";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: string;
  iconPosition?: "left" | "right";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "ghost",
      size = "md",
      icon,
      iconPosition = "left",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed select-none focus:outline-none focus:ring-2 focus:ring-primary/20";

    const variantStyles = {
      primary:
        "bg-primary text-white hover:bg-primary-container active:scale-[0.98] shadow-sm font-semibold",
      ghost:
        "bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container",
      secondary:
        "bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline/50",
      outline:
        "bg-transparent text-on-surface hover:bg-surface-container border border-outline hover:border-outline-variant",
      danger:
        "bg-error text-white hover:bg-error-container active:scale-[0.98]",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 gap-1.5 text-xs rounded-lg",
      md: "px-4 py-2 gap-2 text-sm rounded-xl",
      lg: "px-6 py-3 gap-2.5 text-base rounded-full",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {icon && iconPosition === "left" && (
          <span className="material-symbols-outlined text-[18px]">
            {icon}
          </span>
        )}
        {children}
        {icon && iconPosition === "right" && (
          <span className="material-symbols-outlined text-[18px]">
            {icon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
