import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FeeSummaryCard } from "./fee-summary-card";
import { mockEstimates } from "~/lib/storybook/mocks";
import type { BridgeEstimate } from "~/lib/bridge/types";

const meta: Meta<typeof FeeSummaryCard> = {
  title: "Bridge/FeeSummaryCard",
  component: FeeSummaryCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    fromChain: "Ethereum",
    toChain: "Base",
    amount: "100.00",
    transferMethod: "standard",
  },
  decorators: [
    (Story) => (
      <div className="bg-card border-border w-80 rounded-2xl border">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FeeSummaryCard>;

export const Loading: Story = {
  args: {
    estimate: null,
    isEstimating: true,
  },
};

export const StandardTransfer: Story = {
  args: {
    estimate: mockEstimates.standard,
    isEstimating: false,
  },
};

export const FastTransfer: Story = {
  args: {
    estimate: mockEstimates.fast,
    isEstimating: false,
    transferMethod: "fast",
  },
};

export const WithDetailedGasFees: Story = {
  args: {
    estimate: {
      ...mockEstimates.standard,
      detailedGasFees: [
        {
          name: "Approve",
          token: "ETH",
          blockchain: "Ethereum",
          fees: {
            gas: BigInt(50000),
            gasPrice: BigInt(20000000000),
            fee: "0.001000",
          },
        },
        {
          name: "Burn",
          token: "ETH",
          blockchain: "Ethereum",
          fees: {
            gas: BigInt(100000),
            gasPrice: BigInt(20000000000),
            fee: "0.002000",
          },
        },
        {
          name: "Mint",
          token: "ETH",
          blockchain: "Base",
          fees: {
            gas: BigInt(80000),
            gasPrice: BigInt(1000000000),
            fee: "0.000080",
          },
        },
      ],
    } as BridgeEstimate,
    isEstimating: false,
  },
};

export const FastWithProviderFee: Story = {
  args: {
    estimate: {
      ...mockEstimates.fast,
      providerFees: [
        {
          type: "provider",
          token: "USDC",
          amount: "0.100000",
        },
      ],
      detailedGasFees: [
        {
          name: "Approve",
          token: "ETH",
          blockchain: "Ethereum",
          fees: {
            gas: BigInt(50000),
            gasPrice: BigInt(20000000000),
            fee: "0.001000",
          },
        },
        {
          name: "Burn",
          token: "ETH",
          blockchain: "Ethereum",
          fees: {
            gas: BigInt(100000),
            gasPrice: BigInt(20000000000),
            fee: "0.002000",
          },
        },
      ],
    } as BridgeEstimate,
    isEstimating: false,
    transferMethod: "fast",
  },
};

export const LargeAmount: Story = {
  args: {
    estimate: mockEstimates.standard,
    isEstimating: false,
    amount: "10,000.00",
  },
};

export const EthereumToArbitrum: Story = {
  args: {
    fromChain: "Ethereum",
    toChain: "Arbitrum",
    estimate: mockEstimates.standard,
    isEstimating: false,
  },
};

export const BaseToSolana: Story = {
  args: {
    fromChain: "Base",
    toChain: "Solana",
    estimate: mockEstimates.standard,
    isEstimating: false,
  },
};

export const TestnetRoute: Story = {
  args: {
    fromChain: "Ethereum_Sepolia",
    toChain: "Base_Sepolia",
    estimate: mockEstimates.standard,
    isEstimating: false,
    amount: "50.00",
  },
};
