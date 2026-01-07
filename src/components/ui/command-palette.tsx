"use client";

import { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "motion/react";
import {
  History,
  Wallet,
  Sun,
  Moon,
  TestTube,
  Globe,
  AlertTriangle,
  Gamepad2,
  Github,
  Twitter,
  FileText,
  ExternalLink,
  Search,
  LogOut,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useEnvironment, useSetEnvironment } from "~/lib/bridge";

interface CommandPaletteProps {
  onOpenTransactionHistory: () => void;
  onOpenDisclaimer: () => void;
  onOpenGame: () => void;
}

export function CommandPalette({
  onOpenTransactionHistory,
  onOpenDisclaimer,
  onOpenGame,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { setShowAuthFlow, setShowDynamicUserProfile, primaryWallet, handleLogOut } = useDynamicContext();
  const environment = useEnvironment();
  const setEnvironment = useSetEnvironment();

  // Sync theme state with document
  useEffect(() => {
    const syncTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const setTheme = useCallback((theme: "light" | "dark") => {
    const isDarkTheme = theme === "dark";
    setIsDark(isDarkTheme);
    document.documentElement.classList.toggle("dark", isDarkTheme);
    localStorage.setItem("theme", theme);
  }, []);

  // Toggle with cmd+k or ctrl+k
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      // Also close on Escape
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Command Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2"
          >
            <Command
              className="border-border/50 bg-card/95 overflow-hidden rounded-xl border shadow-2xl backdrop-blur-2xl"
              loop
            >
              {/* Search Input */}
              <div className="border-border/30 flex items-center gap-2 border-b px-4 py-3">
                <Search className="text-muted-foreground size-4" />
                <Command.Input
                  placeholder="Type a command or search..."
                  className="text-foreground placeholder:text-muted-foreground flex-1 bg-transparent text-sm outline-none"
                  autoFocus
                />
                <kbd className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium">
                  ESC
                </kbd>
              </div>

              {/* Command List */}
              <Command.List className="max-h-[400px] overflow-y-auto p-2">
                <Command.Empty className="text-muted-foreground py-6 text-center text-sm">
                  No results found.
                </Command.Empty>

                {/* View Group */}
                <Command.Group heading="View" className="px-2 py-1.5">
                  <CommandItem
                    onSelect={() => runCommand(onOpenTransactionHistory)}
                    icon={<History className="size-4" />}
                    label="Transaction History"
                    shortcut="H"
                  />
                </Command.Group>

                {/* Network Group */}
                <Command.Group heading="Network" className="px-2 py-1.5">
                  <CommandItem
                    onSelect={() => runCommand(() => setEnvironment("mainnet"))}
                    icon={<Globe className="size-4" />}
                    label="Switch to Mainnet"
                    active={environment === "mainnet"}
                  />
                  <CommandItem
                    onSelect={() => runCommand(() => setEnvironment("testnet"))}
                    icon={<TestTube className="size-4" />}
                    label="Switch to Testnet"
                    active={environment === "testnet"}
                  />
                </Command.Group>

                {/* Wallet Group */}
                <Command.Group heading="Wallet" className="px-2 py-1.5">
                  {primaryWallet ? (
                    <>
                      <CommandItem
                        onSelect={() => runCommand(() => setShowDynamicUserProfile(true))}
                        icon={<Wallet className="size-4" />}
                        label="Manage Wallets"
                      />
                      <CommandItem
                        onSelect={() => runCommand(() => void handleLogOut())}
                        icon={<LogOut className="size-4" />}
                        label="Disconnect"
                        destructive
                      />
                    </>
                  ) : (
                    <CommandItem
                      onSelect={() => runCommand(() => setShowAuthFlow(true))}
                      icon={<Wallet className="size-4" />}
                      label="Connect Wallet"
                    />
                  )}
                </Command.Group>

                {/* Theme Group */}
                <Command.Group heading="Theme" className="px-2 py-1.5">
                  <CommandItem
                    onSelect={() => runCommand(() => setTheme("light"))}
                    icon={<Sun className="size-4" />}
                    label="Light Mode"
                    active={!isDark}
                  />
                  <CommandItem
                    onSelect={() => runCommand(() => setTheme("dark"))}
                    icon={<Moon className="size-4" />}
                    label="Dark Mode"
                    active={isDark}
                  />
                </Command.Group>

                {/* Resources Group */}
                <Command.Group heading="Resources" className="px-2 py-1.5">
                  {environment === "testnet" && (
                    <CommandItem
                      onSelect={() => runCommand(() => window.open("https://faucet.circle.com/", "_blank"))}
                      icon={<TestTube className="size-4" />}
                      label="Circle Faucet"
                      external
                    />
                  )}
                  <CommandItem
                    onSelect={() => runCommand(() => window.open("https://github.com", "_blank"))}
                    icon={<Github className="size-4" />}
                    label="GitHub"
                    external
                  />
                  <CommandItem
                    onSelect={() => runCommand(() => window.open("https://twitter.com", "_blank"))}
                    icon={<Twitter className="size-4" />}
                    label="Twitter"
                    external
                  />
                  <CommandItem
                    onSelect={() => runCommand(() => window.open("https://developers.circle.com/stablecoins/docs/cctp-getting-started", "_blank"))}
                    icon={<FileText className="size-4" />}
                    label="CCTP Documentation"
                    external
                  />
                </Command.Group>

                {/* Other Group */}
                <Command.Group heading="Other" className="px-2 py-1.5">
                  <CommandItem
                    onSelect={() => runCommand(onOpenDisclaimer)}
                    icon={<AlertTriangle className="size-4" />}
                    label="Disclaimer"
                  />
                  <CommandItem
                    onSelect={() => runCommand(onOpenGame)}
                    icon={<Gamepad2 className="size-4" />}
                    label="Play Pong"
                  />
                </Command.Group>
              </Command.List>

              {/* Footer */}
              <div className="border-border/30 bg-muted/30 flex items-center justify-between border-t px-4 py-2">
                <div className="text-muted-foreground flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <kbd className="bg-muted rounded px-1">↑↓</kbd> Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="bg-muted rounded px-1">↵</kbd> Select
                  </span>
                </div>
                <div className="text-muted-foreground text-xs">
                  <kbd className="bg-muted rounded px-1">⌘K</kbd> to open
                </div>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Individual command item component
function CommandItem({
  onSelect,
  icon,
  label,
  shortcut,
  active,
  external,
  destructive,
}: {
  onSelect: () => void;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  active?: boolean;
  external?: boolean;
  destructive?: boolean;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        "hover:bg-muted/50 data-[selected=true]:bg-muted/50",
        active && "bg-primary/10 text-primary",
        destructive
          ? "text-red-600 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400"
          : "text-foreground"
      )}
    >
      <span className={cn(
        active && "text-primary",
        destructive
          ? "text-red-600 dark:text-red-400"
          : "text-muted-foreground"
      )}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {active && (
        <span className="text-primary text-xs font-medium">Active</span>
      )}
      {external && (
        <ExternalLink className="text-muted-foreground size-3" />
      )}
      {shortcut && (
        <kbd className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium">
          {shortcut}
        </kbd>
      )}
    </Command.Item>
  );
}
