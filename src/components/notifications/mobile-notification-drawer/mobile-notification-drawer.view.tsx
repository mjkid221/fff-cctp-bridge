"use client";

import { motion } from "motion/react";
import { Bell, X } from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Button } from "~/components/ui/button";
import { NotificationItem } from "../notification-item";
import type { MobileNotificationDrawerViewProps } from "./mobile-notification-drawer.types";

export function MobileNotificationDrawerView({
  notifications,
  onClose,
  onClearAll,
  onNotificationClick,
}: MobileNotificationDrawerViewProps) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="border-border/50 bg-card/95 fixed right-0 bottom-0 left-0 z-40 flex max-h-[85vh] flex-col rounded-t-3xl border-t backdrop-blur-2xl lg:hidden"
      >
        {/* Drag handle */}
        <div className="flex items-center justify-center py-3">
          <div className="bg-muted-foreground/30 h-1.5 w-12 rounded-full" />
        </div>

        {/* Header */}
        <div className="border-border/30 flex items-center justify-between border-b px-4 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-foreground text-lg font-semibold">
              Notifications
            </h3>
            {notifications.length > 0 && (
              <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-semibold">
                {notifications.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-muted-foreground hover:text-foreground h-8 px-2 text-xs"
              >
                Clear all
              </Button>
            )}
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground -mr-2 rounded-full p-2"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1">
          <ScrollArea className="macos-window-scrollbar h-full">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <div className="bg-muted/30 flex size-16 items-center justify-center rounded-full">
                  <Bell className="text-muted-foreground/50 size-8" />
                </div>
                <div className="text-center">
                  <p className="text-foreground text-sm font-medium">
                    No notifications
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    You&apos;re all caught up!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <NotificationItem
                      notification={notification}
                      onAction={onNotificationClick}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </motion.div>
    </>
  );
}
