import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { useState } from "react";
import { motion } from "motion/react";
import { Circle } from "lucide-react";
import { cn } from "~/lib/utils";
import type { NetworkEnvironment } from "~/lib/bridge/networks";

/**
 * Presentational version of NetworkToggle for Storybook.
 * The actual component uses zustand hooks which require store initialization.
 */
interface NetworkToggleViewProps {
  environment: NetworkEnvironment;
  onToggle: () => void;
}

function NetworkToggleView({ environment, onToggle }: NetworkToggleViewProps) {
  const isMainnet = environment === "mainnet";

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className={cn(
        "relative flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-all",
        "hover:bg-muted/50",
      )}
      aria-label={`Switch to ${isMainnet ? "testnet" : "mainnet"}`}
    >
      <Circle
        className={cn(
          "size-2.5 transition-colors",
          isMainnet
            ? "fill-blue-500 text-blue-500"
            : "fill-amber-500 text-amber-500",
        )}
      />
      <span className="text-foreground">
        {isMainnet ? "Mainnet" : "Testnet"}
      </span>
    </motion.button>
  );
}

const meta: Meta<typeof NetworkToggleView> = {
  title: "Bridge/NetworkToggle",
  component: NetworkToggleView,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    onToggle: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof NetworkToggleView>;

export const Mainnet: Story = {
  args: {
    environment: "mainnet",
  },
};

export const Testnet: Story = {
  args: {
    environment: "testnet",
  },
};

export const Interactive: Story = {
  render: function InteractiveToggle() {
    const [environment, setEnvironment] =
      useState<NetworkEnvironment>("mainnet");

    return (
      <div className="flex flex-col items-center gap-4">
        <NetworkToggleView
          environment={environment}
          onToggle={() =>
            setEnvironment(environment === "mainnet" ? "testnet" : "mainnet")
          }
        />
        <p className="text-muted-foreground text-sm">Current: {environment}</p>
      </div>
    );
  },
};

export const InHeader: Story = {
  args: {
    environment: "mainnet",
  },
  decorators: [
    (Story) => (
      <div className="bg-background border-border flex items-center gap-4 rounded-lg border p-3">
        <span className="text-foreground text-sm font-medium">CCTP Bridge</span>
        <Story />
      </div>
    ),
  ],
};
