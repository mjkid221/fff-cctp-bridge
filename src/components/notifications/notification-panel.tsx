"use client";

import { motion, AnimatePresence } from "motion/react";
import { Bell } from "lucide-react";
import {
  useNotifications,
  useIsNotificationPanelOpen,
  useSetNotificationPanelOpen,
  useClearAllNotifications,
  type Notification,
} from "~/lib/notifications";
import { NotificationItem } from "./notification-item";
import { Button } from "~/components/ui/button";
import { useEffect, useRef } from "react";
import { BridgeStorage } from "~/lib/bridge/storage";
import { useBridgeStore } from "~/lib/bridge";

interface NotificationPanelProps {
  onNotificationAction?: (notification: Notification) => void;
}

export function NotificationPanel({ onNotificationAction }: NotificationPanelProps) {
  const notifications = useNotifications();
  const isOpen = useIsNotificationPanelOpen();
  const setIsOpen = useSetNotificationPanelOpen();
  const clearAll = useClearAllNotifications();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Don't close if clicking the notification bell button
      if (target.closest('[data-notification-bell="true"]')) {
        return;
      }

      if (panelRef.current && !panelRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, setIsOpen]);

  const handleNotificationClick = async (notification: Notification) => {
    // If it's a bridge notification with a transaction ID, open transaction window
    if (notification.bridgeTransactionId) {
      // Skip temporary pending IDs (created before real transaction exists)
      if (!notification.bridgeTransactionId.startsWith("pending_")) {
        // Load transaction from IndexedDB
        const transaction = await BridgeStorage.getTransaction(
          notification.bridgeTransactionId
        );

        if (transaction) {
          // Open a new transaction window (or focus existing one)
          useBridgeStore.getState().openTransactionWindow(transaction);
        }
      }

      // Close notification panel
      setIsOpen(false);
    }

    onNotificationAction?.(notification);
  };

  const handleClearAll = () => {
    clearAll();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
            }}
            className="fixed right-4 top-16 z-50 w-full max-w-md"
          >
            {/* Theme-aware glassmorphic container */}
            <div className="overflow-hidden rounded-xl bg-card/95 backdrop-blur-2xl shadow-2xl border border-border/50">
              {/* Header */}
              <div className="border-b border-border/30 px-4 py-3 bg-muted/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-foreground">
                      Notifications
                    </h3>
                    {notifications.length > 0 && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        {notifications.length}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAll}
                      className="h-7 gap-1.5 px-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
              </div>

              {/* Notifications list */}
              <div className="max-h-[32rem] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12">
                    <div className="flex size-16 items-center justify-center rounded-full bg-muted/30">
                      <Bell className="size-8 text-muted-foreground/50" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        No notifications
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        You&apos;re all caught up!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 p-3">
                    {notifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <NotificationItem
                          notification={notification}
                          onAction={handleNotificationClick}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
