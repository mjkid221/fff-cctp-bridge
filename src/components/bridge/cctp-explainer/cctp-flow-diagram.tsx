"use client";

import { forwardRef, useRef } from "react";
import { motion } from "motion/react";
import { cn } from "~/lib/utils";
import { AnimatedBeam } from "~/components/ui/animated-beam";

const Node = forwardRef<
  HTMLDivElement,
  {
    className?: string;
    children?: React.ReactNode;
    label: string;
    sublabel?: string;
    delay?: number;
  }
>(({ className, children, label, sublabel, delay = 0 }, ref) => {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <motion.div
        ref={ref}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
          delay,
        }}
        className={cn(
          "z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)] dark:bg-zinc-900",
          className,
        )}
      >
        {children}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.1 }}
        className="text-center"
      >
        <p className="text-foreground text-sm font-semibold">{label}</p>
        {sublabel && (
          <p className="text-muted-foreground text-[11px]">{sublabel}</p>
        )}
      </motion.div>
    </div>
  );
});

Node.displayName = "Node";

export function CCTPFlowDiagram({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const cctpRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={cn(
        "relative flex w-full items-center justify-center",
        className,
      )}
      ref={containerRef}
    >
      <div className="flex w-full items-start justify-between px-2">
        {/* Source Chain - Burn */}
        <Node ref={sourceRef} label="Burn" sublabel="Source Chain" delay={0}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="size-5 text-orange-500"
          >
            <path
              d="M12 2C8.5 6 4 9 4 14a8 8 0 1 0 16 0c0-5-4.5-8-8-12z"
              fill="currentColor"
              fillOpacity="0.15"
            />
            <path
              d="M12 2C8.5 6 4 9 4 14a8 8 0 1 0 16 0c0-5-4.5-8-8-12z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 18a4 4 0 0 0 4-4c0-2.5-2-4-4-6-2 2-4 3.5-4 6a4 4 0 0 0 4 4z"
              fill="currentColor"
            />
          </svg>
        </Node>

        {/* CCTP Attestation */}
        <Node ref={cctpRef} label="Attest" sublabel="Circle CCTP" delay={0.1}>
          <svg viewBox="0 0 24 24" fill="none" className="size-5 text-blue-500">
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle
              cx="12"
              cy="12"
              r="5"
              fill="currentColor"
              fillOpacity="0.15"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M9 12l2 2 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Node>

        {/* Destination Chain - Mint */}
        <Node ref={destRef} label="Mint" sublabel="Destination" delay={0.2}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="size-5 text-green-500"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="currentColor"
              fillOpacity="0.15"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M12 8v8M8 12h8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </Node>
      </div>

      {/* Animated beams */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={sourceRef}
        toRef={cctpRef}
        gradientStartColor="#f97316"
        gradientStopColor="#3b82f6"
        duration={3}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={cctpRef}
        toRef={destRef}
        gradientStartColor="#3b82f6"
        gradientStopColor="#22c55e"
        duration={3}
        delay={1.5}
      />
    </div>
  );
}
