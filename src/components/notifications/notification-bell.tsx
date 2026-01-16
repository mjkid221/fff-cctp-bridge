"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell } from "lucide-react";
import {
  useUnreadCount,
  useToggleNotificationPanel,
  useIsNotificationPanelOpen,
  useLoadNotifications,
} from "~/lib/notifications";
import { cn } from "~/lib/utils";

export function NotificationBell() {
  const unreadCount = useUnreadCount();
  const togglePanel = useToggleNotificationPanel();
  const isOpen = useIsNotificationPanelOpen();
  const loadNotifications = useLoadNotifications();

  // Load notifications from IndexedDB on mount
  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  return (
    <motion.button
      onClick={togglePanel}
      data-notification-bell="true"
      className={cn(
        "relative flex items-center justify-center rounded-xl p-2.5 transition-all",
        "hover:bg-muted/50",
        isOpen && "bg-muted/70",
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Notifications"
    >
      <Bell
        className={cn(
          "size-5 transition-colors",
          isOpen ? "text-foreground" : "text-muted-foreground",
          unreadCount > 0 && "text-blue-500",
        )}
      />

      {/* Unread badge */}
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white shadow-lg"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse animation for new notifications */}
      {unreadCount > 0 && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-blue-500/20"
          animate={{
            opacity: [0.5, 0],
            scale: [1, 1.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        />
      )}
    </motion.button>
  );
}
