"use client";

import { motion } from "motion/react";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Info,
  Loader2,
  X,
  ArrowRight,
} from "lucide-react";
import type { Notification } from "~/lib/notifications";
import { useRemoveNotification, useMarkAsRead } from "~/lib/notifications";
import { cn } from "~/lib/utils";

interface NotificationItemProps {
  notification: Notification;
  onAction?: (notification: Notification) => void;
}

function formatTimestamp(timestamp: number): string {
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

function getStatusIcon(status: Notification["status"]) {
  switch (status) {
    case "success":
      return <CheckCircle2 className="size-5 text-green-500" />;
    case "failed":
      return <AlertCircle className="size-5 text-red-500" />;
    case "in_progress":
      return <Loader2 className="size-5 animate-spin text-gray-600 dark:text-gray-400" />;
    case "pending":
      return <Clock className="size-5 text-yellow-500" />;
    case "info":
    default:
      return <Info className="size-5 text-gray-500" />;
  }
}

export function NotificationItem({ notification, onAction }: NotificationItemProps) {
  const removeNotification = useRemoveNotification();
  const markAsRead = useMarkAsRead();

  const handleClick = () => {
    markAsRead(notification.id);
    if (onAction) {
      onAction(notification);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNotification(notification.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: "spring",
        damping: 20,
        stiffness: 300,
      }}
      onClick={handleClick}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-xl border border-border/30 backdrop-blur-xl p-4 transition-all",
        "hover:bg-muted/50 hover:shadow-lg hover:border-border/50",
        "bg-muted/20",
        !notification.read && "ring-2 ring-primary/30 shadow-md",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div className="mt-0.5 shrink-0">
          {getStatusIcon(notification.status)}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header with title and timestamp */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-foreground text-sm font-semibold leading-tight">
              {notification.title}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Timestamp badge */}
              <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                {formatTimestamp(notification.timestamp)}
              </span>
              {/* Dismiss button */}
              <button
                onClick={handleDismiss}
                className="rounded-full p-1 opacity-0 transition-all hover:bg-muted/50 group-hover:opacity-100"
                aria-label="Dismiss notification"
              >
                <X className="size-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Message */}
          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mb-2">
            {notification.message}
          </p>

          {/* Bridge transaction details with inline action button */}
          {notification.fromChain && notification.toChain && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-medium bg-muted/50 rounded-full px-3 py-1.5">
                <span className="text-foreground">{notification.fromChain}</span>
                <ArrowRight className="size-3 text-muted-foreground" />
                <span className="text-foreground">{notification.toChain}</span>
                {notification.amount && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-foreground font-semibold">{notification.amount} {notification.token || "USDC"}</span>
                  </>
                )}
              </div>

              {/* Action button - compact inline version */}
              {notification.actionLabel && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "rounded-full px-3 py-1 text-[10px] font-semibold transition-all",
                    notification.status === "failed"
                      ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  View
                </motion.button>
              )}
            </div>
          )}

          {/* Action button for non-bridge notifications */}
          {notification.actionLabel && !notification.fromChain && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "mt-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all backdrop-blur-xl",
                "shadow-md active:shadow-sm",
                notification.status === "failed"
                  ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-red-500/25"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {notification.actionLabel}
            </motion.button>
          )}
        </div>
      </div>

      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute right-2 top-2 size-2 rounded-full bg-primary" />
      )}
    </motion.div>
  );
}
