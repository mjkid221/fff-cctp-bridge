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
        <label className="text-muted-foreground text-sm font-medium">
          {label}
        </label>
        <motion.button
          onClick={handleMaxClick}
          className="text-primary hover:text-primary/80 text-xs font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Balance: {balance} USDC
        </motion.button>
      </div>
      <motion.div
        className={cn(
          "group border-border/50 bg-card/50 relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all",
          "hover:border-border hover:bg-card/80",
          "focus-within:border-ring/50 focus-within:ring-ring/20 focus-within:ring-2",
        )}
        whileHover={{ scale: 1.005 }}
      >
        <div className="flex items-center gap-3 p-4">
          <div className="bg-primary/10 flex size-10 items-center justify-center rounded-xl">
            <DollarSign className="text-primary size-5" />
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
              "text-foreground placeholder:text-muted-foreground/30 flex-1 bg-transparent text-2xl font-semibold outline-none",
            )}
          />
          <motion.button
            onClick={handleMaxClick}
            className={cn(
              "bg-primary/10 text-primary rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              "hover:bg-primary/20",
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            MAX
          </motion.button>
        </div>
        <div className="border-border/30 border-t px-4 py-2">
          <div className="text-muted-foreground text-xs">
            ≈ ${value || "0.00"} USD
          </div>
        </div>
      </motion.div>
    </div>
  );
}
