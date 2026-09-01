import React from "react";
import { Button } from "./Button";

export function LoadingState({ message = "Retrieving archival records..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-xl px-md border border-outline border-dashed rounded-sm bg-surface-container-lowest text-center my-md">
      <div className="w-8 h-8 rounded-full border-2 border-outline border-t-primary animate-spin mb-md" />
      <p className="font-label-caps text-label-caps text-primary tracking-widest uppercase mb-xs">ARCHIVE_SYNC_ACTIVE</p>
      <p className="font-code text-code text-on-surface-variant">{message}</p>
    </div>
  );
}

export function EmptyState({
  title = "No Records Found",
  description = "No archival matches were found for the selected query or filters.",
  actionLabel,
  onAction,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-xl px-md border border-outline border-dashed rounded-sm bg-surface-container-low text-center my-md">
      <span className="material-symbols-outlined text-[36px] text-on-surface-variant mb-sm" data-icon="folder_off">
        folder_off
      </span>
      <h4 className="font-headline-sm text-headline-sm text-on-surface mb-xs">{title}</h4>
      <p className="font-body-dense text-body-dense text-on-surface-variant max-w-md mb-md">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({
  title = "Archive Query Failed",
  message = "An error occurred while communicating with the data source.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-xl px-md border border-error/40 rounded-sm bg-error-container/20 text-center my-md">
      <span className="material-symbols-outlined text-[36px] text-error mb-sm" data-icon="error_outline">
        error_outline
      </span>
      <h4 className="font-headline-sm text-headline-sm text-error mb-xs">{title}</h4>
      <p className="font-code text-code text-on-surface max-w-md mb-md">{message}</p>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry} icon="refresh">
          RETRY QUERY
        </Button>
      )}
    </div>
  );
}
