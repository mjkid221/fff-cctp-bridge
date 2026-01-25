import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { useState, useRef } from "react";
import { ChainSelector } from "./chain-selector";
import type { SupportedChainId } from "~/lib/bridge/networks";

/**
 * ChainSelector stories require the zustand store to be hydrated.
 * This decorator provides the necessary environment context.
 */
const WithStoreDecorator = (Story: React.FC) => {
  // Initialize the store with testnet environment for demo purposes
  // The component uses useEnvironment() internally
  return (
    <div className="w-80">
      <Story />
    </div>
  );
};

const meta: Meta<typeof ChainSelector> = {
  title: "Bridge/ChainSelector",
  component: ChainSelector,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    label: "From Network",
    onSelectChain: fn(),
  },
  decorators: [WithStoreDecorator],
};

export default meta;
type Story = StoryObj<typeof ChainSelector>;

export const Default: Story = {
  args: {
    selectedChain: null,
  },
};

export const EthereumSelected: Story = {
  args: {
    selectedChain: "Ethereum",
  },
};

export const BaseSelected: Story = {
  args: {
    selectedChain: "Base",
  },
};

export const ArbitrumSelected: Story = {
  args: {
    selectedChain: "Arbitrum",
  },
};

export const SolanaSelected: Story = {
  args: {
    selectedChain: "Solana",
  },
};

export const TestnetEthereumSepolia: Story = {
  args: {
    selectedChain: "Ethereum_Sepolia",
    label: "From Network (Testnet)",
  },
};

export const WithExcludedChain: Story = {
  args: {
    selectedChain: "Ethereum",
    excludeChainId: "Base",
    label: "To Network",
  },
};

export const ToNetworkLabel: Story = {
  args: {
    selectedChain: "Base",
    label: "To Network",
    excludeChainId: "Ethereum",
  },
};

export const Interactive: Story = {
  render: function InteractiveChainSelector() {
    const [selectedChain, setSelectedChain] = useState<SupportedChainId | null>(
      null,
    );
    const containerRef = useRef<HTMLDivElement>(null);

    return (
      <div ref={containerRef} className="h-[400px] w-80">
        <ChainSelector
          selectedChain={selectedChain}
          onSelectChain={setSelectedChain}
          label="Select Network"
          containerRef={containerRef}
        />
        {selectedChain && (
          <p className="text-muted-foreground mt-4 text-sm">
            Selected: {selectedChain}
          </p>
        )}
      </div>
    );
  },
};
