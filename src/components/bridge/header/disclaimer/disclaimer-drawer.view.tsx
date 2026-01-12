"use client";

import { motion } from "motion/react";
import { AlertTriangle } from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import type { DisclaimerDrawerProps } from "./disclaimer.types";

export function DisclaimerDrawerView({ onClose }: DisclaimerDrawerProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="border-border/50 bg-card/95 fixed right-0 bottom-0 left-0 z-40 flex max-h-[85vh] flex-col rounded-t-3xl border-t backdrop-blur-2xl lg:hidden"
      >
        <div className="flex items-center justify-center py-3">
          <div className="bg-muted-foreground/30 h-1.5 w-12 rounded-full" />
        </div>
        <div className="border-border/30 flex items-center justify-between border-b px-4 pb-3">
          <h3 className="text-foreground text-lg font-semibold">Disclaimer</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground -mr-2 rounded-full p-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <ScrollArea className="macos-window-scrollbar flex-1">
          <div className="space-y-4 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/10">
                <AlertTriangle className="size-5 text-amber-500" />
              </div>
              <h3 className="text-foreground font-semibold">
                Important Notice
              </h3>
            </div>
            <div className="text-muted-foreground space-y-3 text-sm">
              <p>
                This is an{" "}
                <strong className="text-foreground">
                  unofficial, open-source UI
                </strong>{" "}
                for Circle&apos;s CCTP.
              </p>
              <p>
                <strong className="text-foreground">Unaudited:</strong> Not
                formally security audited.
              </p>
              <p>
                <strong className="text-foreground">
                  Use at Your Own Risk:
                </strong>{" "}
                You accept all blockchain transaction risks.
              </p>
              <p>
                <strong className="text-foreground">No Warranty:</strong>{" "}
                Provided &quot;as is&quot; without warranty.
              </p>
            </div>
          </div>
        </ScrollArea>
      </motion.div>
    </>
  );
}
