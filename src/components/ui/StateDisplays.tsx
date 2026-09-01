import React from "react";
import { Button } from "./Button";

export function LoadingState({ message = "Loading records..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 border border-outline/40 rounded-3xl bg-surface-container/40 text-center my-6 space-y-4 animate-in fade-in duration-150">
      <div className="w-8 h-8 rounded-full border-2 border-outline border-t-primary animate-spin" />
      <p className="text-sm text-on-surface-variant font-medium">{message}</p>
    </div>
  );
}

export function EmptyState({
  title = "No records found",
  description = "No activity was found matching the selected filters.",
  actionLabel,
  onAction,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 border border-outline/40 rounded-3xl bg-surface-container/30 text-center my-6 space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface-variant">
        <span className="material-symbols-outlined text-[24px]">folder_open</span>
      </div>
      <h4 className="text-base font-semibold text-on-surface">{title}</h4>
      <p className="text-sm text-on-surface-variant max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message = "An error occurred while communicating with the data source.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 border border-rose-500/20 rounded-3xl bg-rose-500/5 text-center my-6 space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
        <span className="material-symbols-outlined text-[24px]">error_outline</span>
      </div>
      <h4 className="text-base font-semibold text-rose-500">{title}</h4>
      <p className="text-sm text-on-surface-variant max-w-md">{message}</p>
      {onRetry && (
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={onRetry} icon="refresh">
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
