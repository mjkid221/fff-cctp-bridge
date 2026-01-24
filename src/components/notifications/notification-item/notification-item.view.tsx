"use client";

import { motion } from "motion/react";
import { X, ArrowRight } from "lucide-react";
import { cn } from "~/lib/utils";
import type { NotificationItemViewProps } from "./notification-item.types";

export function NotificationItemView({
  notification,
  formattedTimestamp,
  statusIcon,
  onItemClick,
  onDismiss,
}: NotificationItemViewProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: "spring",
        damping: 20,
        stiffness: 300,
      }}
      onClick={onItemClick}
      className={cn(
        "group border-border/30 relative cursor-pointer overflow-hidden rounded-xl border p-4 backdrop-blur-xl transition-all",
        "hover:bg-muted/50 hover:border-border/50 hover:shadow-lg",
        "bg-muted/20",
        !notification.read && "ring-primary/30 shadow-md ring-2",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div className="mt-0.5 shrink-0">{statusIcon}</div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header with title and timestamp */}
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="text-foreground text-sm leading-tight font-semibold">
              {notification.title}
            </p>
            <div className="flex shrink-0 items-center gap-1.5">
              {/* Timestamp badge */}
              <span className="text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5 text-[10px] font-medium">
                {formattedTimestamp}
              </span>
              {/* Dismiss button */}
              <button
                onClick={onDismiss}
                className="hover:bg-muted/50 rounded-full p-1 opacity-0 transition-all group-hover:opacity-100"
                aria-label="Dismiss notification"
              >
                <X className="text-muted-foreground size-3.5" />
              </button>
            </div>
          </div>

          {/* Message */}
          <p className="text-muted-foreground mb-2 line-clamp-2 text-xs leading-relaxed">
            {notification.message}
          </p>

          {/* Bridge transaction details */}
          {notification.fromChain && notification.toChain && (
            <div className="bg-muted/50 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium">
              <span className="text-foreground">{notification.fromChain}</span>
              <ArrowRight className="text-muted-foreground size-3" />
              <span className="text-foreground">{notification.toChain}</span>
              {notification.amount && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-foreground font-semibold">
                    {notification.amount} {notification.token || "USDC"}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Action button for non-bridge notifications */}
          {notification.actionLabel && !notification.fromChain && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "mt-2 rounded-full px-4 py-1.5 text-xs font-semibold backdrop-blur-xl transition-all",
                "shadow-md active:shadow-sm",
                notification.status === "failed"
                  ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/25 hover:from-red-600 hover:to-red-700"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              {notification.actionLabel}
            </motion.button>
          )}
        </div>
      </div>

      {/* Unread indicator */}
      {!notification.read && (
        <div className="bg-primary absolute top-2 right-2 size-2 rounded-full" />
      )}
    </motion.div>
  );
}
