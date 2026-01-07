/**
 * Notification store using Zustand with persistence
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Notification } from "./types";

interface NotificationState {
  notifications: Notification[];
  isOpen: boolean; // Notification panel open state

  // Actions
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => string; // Returns notification ID
  updateNotification: (id: string, updates: Partial<Omit<Notification, "id" | "timestamp">>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  setIsOpen: (isOpen: boolean) => void;
  togglePanel: () => void;

  // Getters
  getUnreadCount: () => number;
  getNotificationById: (id: string) => Notification | undefined;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      isOpen: false,

      addNotification: (notification) => {
        const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = Date.now();

        const newNotification: Notification = {
          ...notification,
          id,
          timestamp,
          read: false,
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep last 50
        }));

        // Auto-dismiss if specified
        if (newNotification.autoDismissAfter) {
          setTimeout(() => {
            get().removeNotification(id);
          }, newNotification.autoDismissAfter);
        }

        return id; // Return the ID so it can be referenced later
      },

      updateNotification: (id, updates) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, ...updates } : n
          ),
        }));
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      clearAll: () => {
        set({ notifications: [] });
      },

      setIsOpen: (isOpen) => {
        set({ isOpen });
        // Mark all as read when opening panel
        if (isOpen) {
          get().markAllAsRead();
        }
      },

      togglePanel: () => {
        const newIsOpen = !get().isOpen;
        set({ isOpen: newIsOpen });
        // Mark all as read when opening panel
        if (newIsOpen) {
          get().markAllAsRead();
        }
      },

      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.read).length;
      },

      getNotificationById: (id) => {
        return get().notifications.find((n) => n.id === id);
      },
    }),
    {
      name: "cctp-bridge-notifications",
      partialize: (state) => ({
        notifications: state.notifications,
        // Don't persist isOpen state
      }),
    }
  )
);

// Selector hooks for better performance
export const useNotifications = () =>
  useNotificationStore((state) => state.notifications);

export const useUnreadCount = () =>
  useNotificationStore((state) => state.getUnreadCount());

export const useIsNotificationPanelOpen = () =>
  useNotificationStore((state) => state.isOpen);

export const useAddNotification = () =>
  useNotificationStore((state) => state.addNotification);

export const useUpdateNotification = () =>
  useNotificationStore((state) => state.updateNotification);

export const useRemoveNotification = () =>
  useNotificationStore((state) => state.removeNotification);

export const useMarkAsRead = () =>
  useNotificationStore((state) => state.markAsRead);

export const useClearAllNotifications = () =>
  useNotificationStore((state) => state.clearAll);

export const useToggleNotificationPanel = () =>
  useNotificationStore((state) => state.togglePanel);

export const useSetNotificationPanelOpen = () =>
  useNotificationStore((state) => state.setIsOpen);
