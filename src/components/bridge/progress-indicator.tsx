"use client";

import { motion } from "motion/react";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "~/lib/utils";

interface Step {
  label: string;
  status: "completed" | "active" | "pending";
}

interface ProgressIndicatorProps {
  steps: Step[];
}

export function ProgressIndicator({ steps }: ProgressIndicatorProps) {
  return (
    <div className="w-full">
      <div className="relative flex items-center justify-between">
        {/* Progress line */}
        <div className="absolute left-0 right-0 top-5 h-0.5 bg-border/30">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-purple-600"
            initial={{ width: "0%" }}
            animate={{
              width: `${(steps.filter((s) => s.status === "completed").length / (steps.length - 1)) * 100}%`,
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, index) => (
          <div key={index} className="relative z-10 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1, type: "spring" }}
              className={cn(
                "flex size-10 items-center justify-center rounded-full border-2 bg-card transition-all",
                step.status === "completed" &&
                  "border-primary bg-primary text-white",
                step.status === "active" &&
                  "border-primary bg-card text-primary",
                step.status === "pending" && "border-border/50 text-muted-foreground",
              )}
            >
              {step.status === "completed" ? (
                <CheckCircle2 className="size-5" />
              ) : (
                <Circle
                  className={cn(
                    "size-5",
                    step.status === "active" && "animate-pulse",
                  )}
                />
              )}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              className="mt-2 text-xs font-medium text-muted-foreground"
            >
              {step.label}
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}

