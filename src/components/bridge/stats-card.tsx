"use client";

import { motion } from "motion/react";
import { TrendingUp, Activity, Zap } from "lucide-react";
import { cn } from "~/lib/utils";

const stats = [
  {
    icon: TrendingUp,
    label: "Total Volume",
    value: "$2.4B",
    change: "+12.5%",
    color: "from-blue-500/20 to-cyan-500/20",
  },
  {
    icon: Activity,
    label: "Transactions",
    value: "1.2M",
    change: "+8.3%",
    color: "from-purple-500/20 to-pink-500/20",
  },
  {
    icon: Zap,
    label: "Avg. Time",
    value: "~13min",
    change: "-2.1%",
    color: "from-green-500/20 to-emerald-500/20",
  },
];

export function StatsCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full max-w-4xl"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              whileHover={{ scale: 1.02, y: -2 }}
              className={cn(
                "border-border/50 bg-card/50 relative overflow-hidden rounded-2xl border p-6 backdrop-blur-xl transition-all",
                "hover:border-border hover:bg-card/80 hover:shadow-lg",
              )}
            >
              {/* Background gradient */}
              <div
                className={cn(
                  "absolute top-0 right-0 size-32 rounded-full bg-gradient-to-br opacity-50 blur-2xl",
                  stat.color,
                )}
              />

              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl bg-gradient-to-br",
                      stat.color,
                    )}
                  >
                    <Icon className="text-foreground size-5" />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      stat.change.startsWith("+")
                        ? "text-green-500"
                        : "text-red-500",
                    )}
                  >
                    {stat.change}
                  </span>
                </div>
                <div className="text-muted-foreground text-sm">
                  {stat.label}
                </div>
                <div className="text-foreground mt-1 text-2xl font-bold">
                  {stat.value}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
