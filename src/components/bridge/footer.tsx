"use client";

import { motion } from "motion/react";
import { Github, Twitter, FileText } from "lucide-react";
import { cn } from "~/lib/utils";

const socialLinks = [
  {
    icon: Github,
    href: "https://github.com",
    label: "GitHub",
  },
  {
    icon: Twitter,
    href: "https://twitter.com",
    label: "Twitter",
  },
  {
    icon: FileText,
    href: "https://developers.circle.com/stablecoins/docs/cctp-getting-started",
    label: "Documentation",
  },
];

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="w-full border-t border-border/50 bg-card/30 backdrop-blur-xl"
    >
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Logo and description */}
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-600">
              <span className="text-lg font-bold text-white">◈</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">
                CCTP Bridge
              </div>
              <div className="text-xs text-muted-foreground">
                Powered by Circle
              </div>
            </div>
          </div>

          {/* Social links */}
          <div className="flex items-center gap-2">
            {socialLinks.map((link) => {
              const Icon = link.icon;
              return (
                <motion.a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex size-10 items-center justify-center rounded-lg border border-border/50 bg-card/50 transition-all",
                    "hover:border-border hover:bg-card",
                  )}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={link.label}
                >
                  <Icon className="size-4 text-muted-foreground" />
                </motion.a>
              );
            })}
          </div>

          {/* Copyright */}
          <div className="text-xs text-muted-foreground">
            © 2025 CCTP Bridge. All rights reserved.
          </div>
        </div>
      </div>
    </motion.footer>
  );
}

