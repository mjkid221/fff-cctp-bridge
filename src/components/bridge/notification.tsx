"use client";

import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "~/lib/utils";

export type NotificationType = "success" | "error" | "info";

interface NotificationProps {
  type: NotificationType;
  title: string;
  message?: string;
  isVisible: boolean;
  onClose: () => void;
}

export function Notification({
  type,
  title,
  message,
  isVisible,
  onClose,
}: NotificationProps) {
  const config = {
    success: {
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/50",
    },
    error: {
      icon: AlertCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/50",
    },
    info: {
      icon: Info,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/50",
    },
  };

  const { icon: Icon, color, bgColor, borderColor } = config[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="fixed top-4 right-4 z-50 w-full max-w-sm"
        >
          <div
            className={cn(
              "bg-card/95 relative overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-2xl",
              borderColor,
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  bgColor,
                )}
              >
                <Icon className={cn("size-5", color)} />
              </div>
              <div className="flex-1">
                <h4 className="text-foreground font-semibold">{title}</h4>
                {message && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    {message}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
