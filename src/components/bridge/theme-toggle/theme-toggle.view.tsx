"use client";

import type { RefObject } from "react";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface ThemeToggleViewProps {
  buttonRef: RefObject<HTMLButtonElement | null>;
  mounted: boolean;
  isDark: boolean;
  toggleTheme: () => void;
}

export function ThemeToggleView({
  buttonRef,
  mounted,
  isDark,
  toggleTheme,
}: ThemeToggleViewProps) {
  if (!mounted) {
    return <div className="size-4" />;
  }

  return (
    <motion.button
      ref={buttonRef}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      aria-label="Toggle theme"
      type="button"
      className="hover:bg-muted/50 flex items-center justify-center rounded-md p-1.5 transition-colors focus:outline-none"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="sun-icon"
            initial={{ opacity: 0, scale: 0.5, rotate: 90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: -90 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="text-foreground size-4" />
          </motion.span>
        ) : (
          <motion.span
            key="moon-icon"
            initial={{ opacity: 0, scale: 0.5, rotate: 90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: -90 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="text-foreground size-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
