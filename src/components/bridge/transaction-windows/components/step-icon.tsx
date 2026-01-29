"use client";

import { CheckCircle2, AlertCircle, Loader2, Clock, Ban } from "lucide-react";
import type { StepIconProps } from "../transaction-windows.types";

export function StepIcon({ step }: StepIconProps) {
  switch (step.status) {
    case "completed":
      return (
        <div className="flex size-6 items-center justify-center rounded-full bg-green-500/10 ring-2 ring-green-500/20">
          <CheckCircle2 className="size-4 text-green-500" />
        </div>
      );
    case "failed":
      return (
        <div className="flex size-6 items-center justify-center rounded-full bg-red-500/10 ring-2 ring-red-500/20">
          <AlertCircle className="size-4 text-red-500" />
        </div>
      );
    case "in_progress":
      return (
        <div className="flex size-6 items-center justify-center rounded-full bg-gray-500/10 ring-2 ring-gray-500/20">
          <Loader2 className="size-4 animate-spin text-gray-600 dark:text-gray-400" />
        </div>
      );
    case "cancelled":
      return (
        <div className="flex size-6 items-center justify-center rounded-full bg-gray-500/10 ring-2 ring-gray-500/20">
          <Ban className="size-4 text-gray-400" />
        </div>
      );
    case "pending":
    default:
      return (
        <div className="flex size-6 items-center justify-center rounded-full bg-gray-500/5 ring-2 ring-gray-500/10">
          <Clock className="size-4 text-gray-400" />
        </div>
      );
  }
}
