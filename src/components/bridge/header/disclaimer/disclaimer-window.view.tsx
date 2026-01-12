"use client";

import { motion } from "motion/react";
import { AlertTriangle } from "lucide-react";
import { WindowPortal } from "~/components/ui/window-portal";
import { ScrollArea } from "~/components/ui/scroll-area";
import type { DisclaimerWindowViewProps } from "./disclaimer.types";

export function DisclaimerWindowView({
  windowRef,
  isMinimized,
  currentPosition,
  initialPosition,
  zIndex,
  dragControls,
  onDragStart,
  onDragEnd,
  onClose,
  onMinimize,
  onFocus,
}: DisclaimerWindowViewProps) {
  return (
    <WindowPortal>
      <motion.div
        ref={windowRef}
        drag
        dragControls={dragControls}
        dragListener={false}
        dragElastic={0}
        dragMomentum={false}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        initial={{
          opacity: 0,
          scale: 0.95,
          x: initialPosition.x,
          y: initialPosition.y,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          x: currentPosition.x,
          y: currentPosition.y,
        }}
        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed top-0 left-0 hidden lg:block"
        style={{ touchAction: "none", zIndex }}
        onPointerDown={onFocus}
      >
        <div className="border-border/50 bg-card/95 w-[500px] overflow-hidden rounded-xl border shadow-2xl backdrop-blur-2xl">
          {/* macOS-style title bar */}
          <div
            className="bg-muted/40 group border-border/30 flex cursor-grab items-center justify-between border-b px-3 py-2.5 active:cursor-grabbing"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="group/btn relative size-3 rounded-full bg-red-500 transition-all hover:bg-red-600"
                aria-label="Close window"
              >
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-red-900 opacity-0 transition-opacity group-hover/btn:opacity-100">
                  ×
                </span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onMinimize();
                }}
                className="group/btn relative size-3 rounded-full bg-yellow-500 transition-all hover:bg-yellow-600"
                aria-label="Minimize window"
              >
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-yellow-900 opacity-0 transition-opacity group-hover/btn:opacity-100">
                  −
                </span>
              </motion.button>
              <div className="size-3 rounded-full bg-gray-400" />
            </div>
            <div className="text-muted-foreground pointer-events-none absolute left-1/2 -translate-x-1/2 text-xs font-medium">
              Disclaimer
            </div>
            <div className="w-[52px]" />
          </div>

          {/* Content */}
          <motion.div
            animate={{
              height: isMinimized ? 0 : "auto",
              opacity: isMinimized ? 0 : 1,
            }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <ScrollArea className="macos-window-scrollbar max-h-[500px]">
              <div className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/10">
                    <AlertTriangle className="size-5 text-amber-500" />
                  </div>
                  <h3 className="text-foreground text-lg font-semibold">
                    Important Notice
                  </h3>
                </div>

                <div className="text-muted-foreground space-y-3 text-sm leading-relaxed">
                  <p>
                    This is an{" "}
                    <strong className="text-foreground">
                      unofficial, open-source user interface
                    </strong>{" "}
                    for Circle&apos;s Cross-Chain Transfer Protocol (CCTP).
                    This application is not developed, maintained, or endorsed
                    by Circle Internet Financial, LLC.
                  </p>

                  <p>
                    <strong className="text-foreground">
                      Unaudited Software:
                    </strong>{" "}
                    This software has not undergone a formal security audit.
                    While we strive for security best practices, users should be
                    aware that undiscovered vulnerabilities may exist.
                  </p>

                  <p>
                    <strong className="text-foreground">
                      Use at Your Own Risk:
                    </strong>{" "}
                    By using this application, you acknowledge and accept all
                    risks associated with blockchain transactions, including but
                    not limited to loss of funds, failed transactions, and smart
                    contract vulnerabilities.
                  </p>

                  <p>
                    <strong className="text-foreground">No Warranty:</strong>{" "}
                    This software is provided &quot;as is&quot; without warranty
                    of any kind, express or implied. The developers assume no
                    liability for any damages arising from the use of this
                    application.
                  </p>

                  <p className="text-muted-foreground/70 text-xs">
                    Always verify transaction details before confirming. Never
                    bridge more than you can afford to lose.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </motion.div>
        </div>
      </motion.div>
    </WindowPortal>
  );
}
