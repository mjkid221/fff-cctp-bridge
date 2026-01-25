"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { ComponentType } from "react";
import { Menu, X, Bell, Sun, Moon } from "lucide-react";
import {
  useUnreadCount,
  useToggleNotificationPanel,
} from "~/lib/notifications";
import { getMobileMenuItems } from "./header-controls-config";
import type { BridgeHeaderViewProps } from "../bridge-header.types";

interface MobileMenuProps {
  viewProps: BridgeHeaderViewProps;
}

interface MobileMenuItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
  badge?: string;
}

export function MobileMenu({ viewProps }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  }, [isDark]);

  // Notification hooks
  const unreadCount = useUnreadCount();
  const toggleNotificationPanel = useToggleNotificationPanel();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Build menu items from config
  const configItems = getMobileMenuItems();

  const menuItems = useMemo((): MobileMenuItem[] => {
    return configItems.map((control) => {
      if (control.id === "theme-toggle") {
        return {
          id: control.id,
          label: isDark ? "Light Mode" : "Dark Mode",
          icon: isDark ? Sun : Moon,
          onClick: () => {
            toggleTheme();
            setIsOpen(false);
          },
        };
      }

      // Special handling for notifications (needs dynamic badge)
      if (control.id === "notifications") {
        return {
          id: control.id,
          label: control.label ?? "Notifications",
          icon: Bell,
          onClick: () => {
            toggleNotificationPanel();
            setIsOpen(false);
          },
          badge: unreadCount > 0 ? unreadCount.toString() : undefined,
        };
      }

      return {
        id: control.id,
        label: control.label ?? control.id,
        icon: control.icon!,
        onClick: () => {
          control.onClick?.(viewProps);
          setIsOpen(false);
        },
        badge:
          typeof control.badge === "function"
            ? control.badge(viewProps)
            : control.badge,
      };
    });
  }, [
    configItems,
    isDark,
    unreadCount,
    viewProps,
    toggleTheme,
    toggleNotificationPanel,
  ]);

  return (
    <div className="relative lg:hidden">
      {/* Hamburger button */}
      <motion.button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.95 }}
        className="text-foreground hover:bg-muted/50 flex h-7 w-7 items-center justify-center rounded-md"
        aria-label="Menu"
      >
        {isOpen ? <X className="size-4" /> : <Menu className="size-4" />}
      </motion.button>

      {/* Dropdown menu */}
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

            {/* Menu panel - full width, sticks to navbar bottom */}
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="border-border/50 bg-card/95 fixed top-12 right-0 left-0 z-50 border-b p-2 shadow-xl backdrop-blur-xl"
            >
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="text-foreground hover:bg-muted/50 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
                >
                  <item.icon className="size-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
