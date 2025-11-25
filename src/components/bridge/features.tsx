"use client";

import { motion } from "motion/react";
import { Shield, Zap, DollarSign, Lock } from "lucide-react";
import { cn } from "~/lib/utils";

const features = [
  {
    icon: Shield,
    title: "Secure & Trustless",
    description: "Built on Circle's CCTP protocol with native USDC transfers",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Average transfer time of ~13 minutes across all chains",
  },
  {
    icon: DollarSign,
    title: "Zero Bridge Fees",
    description: "Only pay network gas fees, no additional bridge charges",
  },
  {
    icon: Lock,
    title: "Non-Custodial",
    description: "You maintain full control of your assets at all times",
  },
];

export function Features() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="w-full max-w-6xl"
    >
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-foreground">Why CCTP Bridge?</h2>
        <p className="mt-2 text-muted-foreground">
          The most efficient way to move USDC across chains
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              whileHover={{ y: -4 }}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-xl transition-all",
                "hover:border-border hover:bg-card/50 hover:shadow-lg",
              )}
            >
              <div className="relative z-10">
                <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 transition-all group-hover:bg-primary/20">
                  <Icon className="size-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>

              {/* Hover gradient effect */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

