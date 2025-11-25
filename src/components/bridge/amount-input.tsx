"use client";

import { motion } from "motion/react";
import { DollarSign } from "lucide-react";
import { cn } from "~/lib/utils";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  balance?: string;
  label: string;
}

export function AmountInput({
  value,
  onChange,
  balance = "0.00",
  label,
}: AmountInputProps) {
  const handleMaxClick = () => {
    onChange(balance);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground">
          {label}
        </label>
        <motion.button
          onClick={handleMaxClick}
          className="text-xs font-medium text-primary hover:text-primary/80"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Balance: {balance} USDC
        </motion.button>
      </div>
      <motion.div
        className={cn(
          "group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl transition-all",
          "hover:border-border hover:bg-card/80",
          "focus-within:border-ring/50 focus-within:ring-2 focus-within:ring-ring/20",
        )}
        whileHover={{ scale: 1.005 }}
      >
        <div className="flex items-center gap-3 p-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <DollarSign className="size-5 text-primary" />
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              const val = e.target.value;
              // Only allow numbers and one decimal point
              if (val === "" || /^\d*\.?\d*$/.test(val)) {
                onChange(val);
              }
            }}
            placeholder="0.00"
            className={cn(
              "flex-1 bg-transparent text-2xl font-semibold text-foreground outline-none placeholder:text-muted-foreground/30",
            )}
          />
          <motion.button
            onClick={handleMaxClick}
            className={cn(
              "rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors",
              "hover:bg-primary/20",
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            MAX
          </motion.button>
        </div>
        <div className="border-t border-border/30 px-4 py-2">
          <div className="text-xs text-muted-foreground">
            ≈ ${value || "0.00"} USD
          </div>
        </div>
      </motion.div>
    </div>
  );
}

