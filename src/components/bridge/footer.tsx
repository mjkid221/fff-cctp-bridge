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
      className="border-border/50 bg-card/30 w-full border-t backdrop-blur-xl"
    >
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Logo and description */}
          <div className="flex items-center gap-3">
            <div className="from-primary flex size-8 items-center justify-center rounded-lg bg-gradient-to-br to-purple-600">
              <span className="text-lg font-bold text-white">◈</span>
            </div>
            <div>
              <div className="text-foreground text-sm font-semibold">
                CCTP Bridge
              </div>
              <div className="text-muted-foreground text-xs">
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
                    "border-border/50 bg-card/50 flex size-10 items-center justify-center rounded-lg border transition-all",
                    "hover:border-border hover:bg-card",
                  )}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={link.label}
                >
                  <Icon className="text-muted-foreground size-4" />
                </motion.a>
              );
            })}
          </div>

          {/* Copyright */}
          <div className="text-muted-foreground text-xs">
            © 2025 CCTP Bridge. All rights reserved.
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
