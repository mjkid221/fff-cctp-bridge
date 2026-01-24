/**
 * Notification store using Zustand with IndexedDB persistence
 */

import { create } from "zustand";
import type { Notification } from "./types";
import { NotificationStorage } from "./storage";

interface NotificationState {
  notifications: Notification[];
  isOpen: boolean; // Notification panel open state
  isLoaded: boolean; // Whether notifications have been loaded from IndexedDB

  // Actions
  loadNotifications: () => Promise<void>;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">,
  ) => Promise<string>; // Returns notification ID
  updateNotification: (
    id: string,
    updates: Partial<Omit<Notification, "id" | "timestamp">>,
  ) => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => Promise<void>;
  setIsOpen: (isOpen: boolean) => void;
  togglePanel: () => void;

  // Getters
  getUnreadCount: () => number;
  getNotificationById: (id: string) => Notification | undefined;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  isOpen: false,
  isLoaded: false,

  loadNotifications: async () => {
    if (get().isLoaded) return;

    const notifications = await NotificationStorage.getAll();
    set({ notifications, isLoaded: true });
  },

  addNotification: async (notification) => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();

    const newNotification: Notification = {
      ...notification,
      id,
      timestamp,
      read: false,
    };

    await NotificationStorage.save(newNotification);

    set((state) => ({
      notifications: [newNotification, ...state.notifications].slice(0, 50),
    }));

    // Auto-dismiss if specified
    if (newNotification.autoDismissAfter) {
      setTimeout(() => {
        void get().removeNotification(id);
      }, newNotification.autoDismissAfter);
    }

    return id;
  },

  updateNotification: async (id, updates) => {
    await NotificationStorage.update(id, updates);

    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, ...updates } : n,
      ),
    }));
  },

  removeNotification: async (id) => {
    await NotificationStorage.remove(id);

    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    }));

    void NotificationStorage.update(id, { read: true });
  },

  markAllAsRead: () => {
    const notifications = get().notifications;

    set({
      notifications: notifications.map((n) => ({ ...n, read: true })),
    });

    void Promise.all(
      notifications
        .filter((n) => !n.read)
        .map((n) => NotificationStorage.update(n.id, { read: true })),
    );
  },

  clearAll: async () => {
    await NotificationStorage.clearAll();
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
}));

// Selector hooks for better performance
export const useNotifications = () =>
  useNotificationStore((state) => state.notifications);

export const useUnreadCount = () =>
  useNotificationStore((state) => state.getUnreadCount());

export const useIsNotificationPanelOpen = () =>
  useNotificationStore((state) => state.isOpen);

export const useNotificationsLoaded = () =>
  useNotificationStore((state) => state.isLoaded);

export const useLoadNotifications = () =>
  useNotificationStore((state) => state.loadNotifications);

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
