"use client";

import { motion } from "motion/react";
import { AlertCircle, CheckCircle2, Wallet } from "lucide-react";
import { cn } from "~/lib/utils";
import type { DestinationAddressInputViewProps } from "./destination-address-input.types";

export function DestinationAddressInputView({
  value,
  onChange,
  validationError,
  isValid,
  formatDescription,
}: DestinationAddressInputViewProps) {
  return (
    <div className="space-y-2">
      <div className="border-border/50 bg-card/50 hover:border-border hover:bg-card/80 relative flex h-[62px] items-center gap-3 rounded-xl border px-4 py-3 backdrop-blur-xl transition-all">
        {/* Wallet icon matching the selector */}
        <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
          <Wallet className="size-4 text-blue-500" />
        </div>

        {/* Input field */}
        <input
          id="destination-address"
          type="text"
          placeholder={`Enter ${formatDescription}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "placeholder:text-muted-foreground flex-1 bg-transparent font-mono text-sm outline-none",
            validationError && value
              ? "text-red-500"
              : isValid && value
                ? "text-green-500"
                : "text-foreground",
          )}
        />

        {/* Validation icon */}
        {value && (
          <div className="flex-shrink-0">
            {isValid ? (
              <CheckCircle2 className="size-4 text-green-500" />
            ) : (
              <AlertCircle className="size-4 text-red-500" />
            )}
          </div>
        )}
      </div>

      {/* Validation message */}
      {value && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex items-start gap-2 text-xs"
        >
          {validationError ? (
            <>
              <AlertCircle className="mt-0.5 size-3 flex-shrink-0 text-red-500" />
              <span className="text-red-500">{validationError}</span>
            </>
          ) : isValid ? (
            <>
              <CheckCircle2 className="mt-0.5 size-3 flex-shrink-0 text-green-500" />
              <span className="text-green-500">Valid {formatDescription}</span>
            </>
          ) : null}
        </motion.div>
      )}
    </div>
  );
}
