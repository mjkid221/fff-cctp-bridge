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

interface NotificationBellProps {
  isDragging?: boolean;
}

export function NotificationBell({ isDragging }: NotificationBellProps) {
  const unreadCount = useUnreadCount();
  const togglePanel = useToggleNotificationPanel();
  const isOpen = useIsNotificationPanelOpen();
  const loadNotifications = useLoadNotifications();

  // Load notifications from IndexedDB on mount
  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const handleClick = () => {
    if (!isDragging) {
      togglePanel();
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      data-notification-bell="true"
      className={cn(
        "relative h-7 w-7 rounded-md p-0 transition-all",
        "flex items-center justify-center",
        "hover:bg-muted/50",
        isOpen && "bg-muted/70",
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Notifications"
    >
      <Bell
        className={cn(
          "size-4 transition-colors",
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
            className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white shadow-lg"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse animation for new notifications */}
      {unreadCount > 0 && (
        <motion.div
          className="absolute inset-0 rounded-md bg-blue-500/20"
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
