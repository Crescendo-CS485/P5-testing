import { Loader2, RefreshCw, AlertCircle, Inbox } from "lucide-react";
import { Button } from "./ui/button";

/**
 * Reusable Page State Components
 * Consistent UI states across all pages
 */

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-[#666666]">
      <Loader2 className="w-10 h-10 animate-spin mb-4" />
      <span className="text-sm">{message}</span>
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry: () => void;
}

export function ErrorState({
  title = "API Connection Error",
  message = "Unable to load content. This could be due to a temporary service outage.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="text-center py-16 bg-[#252525] border border-[#333333] rounded-sm">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-[#999999] mb-4 max-w-md mx-auto">{message}</p>
      <Button
        onClick={onRetry}
        className="bg-[#5b9dd9] hover:bg-[#4a8bc2] text-white rounded-sm"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Retry Connection
      </Button>
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = "No Content Found",
  message = "Try adjusting your filters or check back later.",
  actionLabel = "Reset Filters",
  onAction,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 bg-[#252525] border border-[#333333] rounded-sm">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-[#333333] rounded-full flex items-center justify-center">
          <Inbox className="w-8 h-8 text-[#666666]" />
        </div>
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-[#999999] mb-4">{message}</p>
      {onAction && (
        <Button
          onClick={onAction}
          variant="outline"
          className="border-[#333333] text-white hover:bg-[#1a1a1a] rounded-sm"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
