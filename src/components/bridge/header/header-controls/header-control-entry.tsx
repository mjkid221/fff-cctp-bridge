"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Wallet, ChevronDown, LogOut, User } from "lucide-react";
import { cn } from "~/lib/utils";
import type { BridgeHeaderViewProps } from "../bridge-header.types";
import type { HeaderControlItem } from "./header-controls.types";

interface HeaderControlEntryProps {
  control: HeaderControlItem;
  viewProps: BridgeHeaderViewProps;
}

export function HeaderControlEntry({
  control,
  viewProps,
}: HeaderControlEntryProps) {
  if (control.visible && !control.visible(viewProps)) {
    return null;
  }

  const getVisibilityClasses = () => {
    switch (control.visibleBreakpoint) {
      case "mobile":
        return "lg:hidden";
      case "desktop":
        return "hidden lg:block";
      default:
        return "";
    }
  };

  const visibilityClasses = getVisibilityClasses();

  if (control.type === "divider") {
    return (
      <div
        className={cn(
          "bg-border/30 hidden h-4 w-px sm:block",
          visibilityClasses,
        )}
      />
    );
  }

  if (control.type === "component" && control.component) {
    const Component = control.component as React.ComponentType<{
      isDragging?: boolean;
    }>;
    return (
      <div className={visibilityClasses}>
        <Component isDragging={viewProps.isDraggingControls} />
      </div>
    );
  }

  if (control.type === "icon-button" && control.icon) {
    const Icon = control.icon;
    const badge =
      typeof control.badge === "function"
        ? control.badge(viewProps)
        : control.badge;

    return (
      <motion.button
        onClick={() => {
          if (!viewProps.isDraggingControls) {
            control.onClick?.(viewProps);
          }
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "text-foreground relative h-7 w-7 rounded-md p-0 transition-colors",
          "hover:bg-muted/50 focus:ring-0 focus:outline-none",
          "flex items-center justify-center",
          visibilityClasses,
        )}
        aria-label={control.ariaLabel}
      >
        <Icon className={cn("size-4", control.iconClassName)} />
        {badge && (
          <kbd className="bg-muted/80 text-muted-foreground absolute -bottom-0.5 left-1/2 hidden -translate-x-1/2 rounded px-1 text-[8px] leading-tight font-medium sm:block">
            {badge}
          </kbd>
        )}
      </motion.button>
    );
  }

  if (control.type === "wallet") {
    return <WalletButton viewProps={viewProps} />;
  }

  return null;
}

/**
 * Wallet button with simple click-to-toggle menu (avoids Radix onPointerDown issues)
 */
function WalletButton({ viewProps }: { viewProps: BridgeHeaderViewProps }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const {
    isConnected,
    walletAddress,
    onConnectWallet,
    onManageWallets,
    onLogout,
    isDraggingControls,
  } = viewProps;

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

  // Close menu when dragging starts
  useEffect(() => {
    if (isDraggingControls && isOpen) {
      setIsOpen(false);
    }
  }, [isDraggingControls, isOpen]);

  const handleClick = () => {
    if (!isDraggingControls) {
      setIsOpen((prev) => !prev);
    }
  };

  if (isConnected) {
    return (
      <div className="relative">
        <motion.button
          ref={buttonRef}
          onClick={handleClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "text-foreground h-7 w-[90px] rounded-md px-1.5 transition-colors sm:h-8 sm:min-w-[100px] sm:px-2.5",
            "hover:bg-muted/50 focus:ring-0 focus:outline-none",
            "flex items-center justify-center gap-1 sm:gap-1.5",
          )}
        >
          <div className="size-1.5 rounded-full bg-green-500" />
          <span className="text-[11px] font-medium sm:text-xs">
            {walletAddress?.slice(0, 4)}...
            {walletAddress?.slice(-3)}
          </span>
          <ChevronDown className="size-2.5 sm:size-3" />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="border-border/50 bg-card/95 absolute top-full right-0 z-50 mt-4 w-48 rounded-md border p-1 shadow-lg backdrop-blur-xl"
            >
              <button
                onClick={() => {
                  onManageWallets();
                  setIsOpen(false);
                }}
                className="text-foreground hover:bg-muted/50 flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm"
              >
                <User className="mr-2 size-3.5" />
                Manage Wallets
              </button>
              <div className="bg-border/30 my-1 h-px" />
              <button
                onClick={() => {
                  onLogout();
                  setIsOpen(false);
                }}
                className="hover:bg-muted/50 flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm text-red-600 dark:text-red-400"
              >
                <LogOut className="mr-2 size-3.5" />
                Disconnect
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <motion.button
      onClick={() => {
        if (!isDraggingControls) {
          onConnectWallet();
        }
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "text-foreground h-7 w-[90px] rounded-md px-1.5 transition-colors sm:h-8 sm:min-w-[100px] sm:px-2.5",
        "hover:bg-muted/50 focus:ring-0 focus:outline-none",
        "flex items-center justify-center gap-1 sm:gap-1.5",
      )}
    >
      <Wallet className="size-3 sm:size-3.5" />
      <span className="text-[11px] font-medium sm:text-xs">Connect</span>
    </motion.button>
  );
}
