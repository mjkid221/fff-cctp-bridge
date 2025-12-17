"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function ThemeToggle() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;

    const stored = localStorage.getItem("theme");
    if (stored) {
      return stored === "dark";
    }

    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    setMounted(true);

    const stored = localStorage.getItem("theme");
    if (stored) {
      const isDarkTheme = stored === "dark";
      setIsDark(isDarkTheme);
      document.documentElement.classList.toggle("dark", isDarkTheme);
    }
  }, []);

  useEffect(() => {
    const syncTheme = () =>
      setIsDark(document.documentElement.classList.contains("dark"));

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return;

    if (!document.startViewTransition) {
      const toggled = !isDark;
      setIsDark(toggled);
      document.documentElement.classList.toggle("dark", toggled);
      localStorage.setItem("theme", toggled ? "dark" : "light");
      return;
    }

    await document.startViewTransition(() => {
      flushSync(() => {
        const toggled = !isDark;
        setIsDark(toggled);
        document.documentElement.classList.toggle("dark", toggled);
        localStorage.setItem("theme", toggled ? "dark" : "light");
      });
    }).ready;

    const { left, top, width, height } =
      buttonRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const maxDistance = Math.hypot(
      Math.max(centerX, window.innerWidth - centerX),
      Math.max(centerY, window.innerHeight - centerY),
    );

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${centerX}px ${centerY}px)`,
          `circle(${maxDistance}px at ${centerX}px ${centerY}px)`,
        ],
      },
      {
        duration: 700,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  }, [isDark]);

  if (!mounted) {
    return <div className="size-4" />;
  }

  return (
    <motion.button
      ref={buttonRef}
      whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }}
      whileTap={{ scale: 0.98 }}
      onClick={toggleTheme}
      aria-label="Toggle theme"
      type="button"
      className="flex items-center justify-center rounded-md p-1.5 transition-colors hover:bg-muted/50 focus:outline-none"
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


