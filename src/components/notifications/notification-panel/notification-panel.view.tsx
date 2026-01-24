"use client";

import { motion, AnimatePresence } from "motion/react";
import { Bell } from "lucide-react";
import { NotificationItem } from "../notification-item";
import { Button } from "~/components/ui/button";
import { WindowPortal } from "~/components/ui/window-portal";
import { ScrollArea } from "~/components/ui/scroll-area";
import type { NotificationPanelViewProps } from "./notification-panel.types";

export function NotificationPanelView({
  isOpen,
  panelRef,
  notifications,
  onClose,
  onNotificationClick,
  onClearAll,
}: NotificationPanelViewProps) {
  return (
    <WindowPortal>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0"
              style={{ zIndex: 199 }}
              onClick={onClose}
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
              className="fixed top-14 right-4 w-full max-w-md"
              style={{ zIndex: 200 }}
            >
              {/* Theme-aware glassmorphic container */}
              <div className="border-border/50 bg-card/95 overflow-hidden rounded-xl border shadow-2xl backdrop-blur-2xl">
                {/* Header */}
                <div className="border-border/30 bg-muted/40 border-b px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-foreground text-sm font-medium">
                        Notifications
                      </h3>
                      {notifications.length > 0 && (
                        <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[10px] font-semibold">
                          {notifications.length}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    {notifications.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearAll}
                        className="text-muted-foreground hover:bg-muted/50 hover:text-foreground h-7 gap-1.5 px-2 text-xs font-medium"
                      >
                        Clear all
                      </Button>
                    )}
                  </div>
                </div>

                {/* Notifications list */}
                <ScrollArea className="macos-window-scrollbar max-h-[32rem]">
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
                    <div className="space-y-2 p-3">
                      {notifications.map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
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
        )}
      </AnimatePresence>
    </WindowPortal>
  );
}
