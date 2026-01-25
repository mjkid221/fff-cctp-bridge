import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell } from "lucide-react";
import { cn } from "~/lib/utils";

/**
 * Presentational version of NotificationBell for Storybook.
 * The actual component uses zustand hooks which require store initialization.
 */
interface NotificationBellViewProps {
  unreadCount: number;
  isOpen: boolean;
  onClick: () => void;
}

function NotificationBellView({
  unreadCount,
  isOpen,
  onClick,
}: NotificationBellViewProps) {
  return (
    <motion.button
      onClick={onClick}
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

const meta: Meta<typeof NotificationBellView> = {
  title: "Notifications/NotificationBell",
  component: NotificationBellView,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    onClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof NotificationBellView>;

export const Default: Story = {
  args: {
    unreadCount: 0,
    isOpen: false,
  },
};

export const WithUnread: Story = {
  args: {
    unreadCount: 3,
    isOpen: false,
  },
};

export const ManyUnread: Story = {
  args: {
    unreadCount: 15,
    isOpen: false,
  },
};

export const PanelOpen: Story = {
  args: {
    unreadCount: 0,
    isOpen: true,
  },
};

export const OpenWithUnread: Story = {
  args: {
    unreadCount: 5,
    isOpen: true,
  },
};

export const Interactive: Story = {
  render: function InteractiveBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(3);

    return (
      <div className="flex flex-col items-center gap-4">
        <NotificationBellView
          unreadCount={unreadCount}
          isOpen={isOpen}
          onClick={() => setIsOpen(!isOpen)}
        />
        <div className="flex gap-2">
          <button
            onClick={() => setUnreadCount((c) => c + 1)}
            className="bg-muted rounded px-2 py-1 text-xs"
          >
            Add notification
          </button>
          <button
            onClick={() => setUnreadCount(0)}
            className="bg-muted rounded px-2 py-1 text-xs"
          >
            Clear all
          </button>
        </div>
        <p className="text-muted-foreground text-sm">
          {isOpen ? "Panel Open" : "Panel Closed"} • {unreadCount} unread
        </p>
      </div>
    );
  },
};

export const InHeader: Story = {
  args: {
    unreadCount: 2,
    isOpen: false,
  },
  decorators: [
    (Story) => (
      <div className="bg-background border-border flex items-center gap-3 rounded-lg border p-3">
        <span className="text-foreground text-sm font-medium">Bridge</span>
        <div className="flex-1" />
        <Story />
      </div>
    ),
  ],
};
