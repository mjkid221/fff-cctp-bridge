import type { ReactNode } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Info,
  Loader2,
} from "lucide-react";
import { createElement } from "react";
import type { Notification } from "~/lib/notifications";

export function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function getStatusIcon(status: Notification["status"]): ReactNode {
  switch (status) {
    case "success":
      return createElement(CheckCircle2, { className: "size-5 text-green-500" });
    case "failed":
      return createElement(AlertCircle, { className: "size-5 text-red-500" });
    case "in_progress":
      return createElement(Loader2, {
        className: "size-5 animate-spin text-gray-600 dark:text-gray-400",
      });
    case "pending":
      return createElement(Clock, { className: "size-5 text-yellow-500" });
    case "info":
    default:
      return createElement(Info, { className: "size-5 text-gray-500" });
  }
}
