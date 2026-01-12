"use client";

import { motion } from "motion/react";
import { WindowPortal } from "~/components/ui/window-portal";
import { PongGame } from "./pong-game";
import type { PongWindowViewProps } from "./pong.types";

export function PongWindowView({
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
}: PongWindowViewProps) {
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
        <div className="border-border/50 bg-card/95 overflow-hidden rounded-xl border shadow-2xl backdrop-blur-2xl">
          {/* Title bar */}
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
              Pong
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
            <div className="p-4">
              <PongGame />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </WindowPortal>
  );
}
