import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { useRef } from "react";
import { useDragControls } from "motion/react";
import { TransactionWindowView } from "./transaction-window.view";
import { mockTransactions } from "~/lib/storybook/mocks";

/**
 * Wrapper component to provide dragControls and windowRef
 */
function TransactionWindowWrapper(
  props: Omit<
    React.ComponentProps<typeof TransactionWindowView>,
    "windowRef" | "dragControls"
  >,
) {
  const windowRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  return (
    <TransactionWindowView
      {...props}
      windowRef={windowRef}
      dragControls={dragControls}
    />
  );
}

const meta: Meta<typeof TransactionWindowWrapper> = {
  title: "Bridge/TransactionWindow",
  component: TransactionWindowWrapper,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    position: { x: 100, y: 100 },
    currentPosition: { x: 100, y: 100 },
    zIndex: 100,
    isMinimized: false,
    isMaximized: false,
    copiedHash: null,
    isRetrying: false,
    onDragStart: fn(),
    onDragEnd: fn(),
    onClose: fn(),
    onFocus: fn(),
    onMinimize: fn(),
    onMaximize: fn(),
    onCopyToClipboard: fn(),
    onRetryStep: fn(),
    onDismiss: fn(),
  },
  decorators: [
    (Story) => (
      <div className="bg-background relative h-screen w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TransactionWindowWrapper>;

export const Pending: Story = {
  args: {
    transaction: mockTransactions.pending,
    isCompleted: false,
    isFailed: false,
    isInProgress: false,
    isCancelled: false,
    fromNetworkDisplayName: "Ethereum",
    toNetworkDisplayName: "Base",
    fromNetworkExplorerUrl: "https://etherscan.io",
    toNetworkExplorerUrl: "https://basescan.org",
  },
};

export const InProgress: Story = {
  args: {
    transaction: mockTransactions.inProgress,
    isCompleted: false,
    isFailed: false,
    isInProgress: true,
    isCancelled: false,
    fromNetworkDisplayName: "Ethereum",
    toNetworkDisplayName: "Arbitrum",
    fromNetworkExplorerUrl: "https://etherscan.io",
    toNetworkExplorerUrl: "https://arbiscan.io",
  },
};

export const Completed: Story = {
  args: {
    transaction: mockTransactions.completed,
    isCompleted: true,
    isFailed: false,
    isInProgress: false,
    isCancelled: false,
    fromNetworkDisplayName: "Base",
    toNetworkDisplayName: "Ethereum",
    fromNetworkExplorerUrl: "https://basescan.org",
    toNetworkExplorerUrl: "https://etherscan.io",
  },
};

export const Failed: Story = {
  args: {
    transaction: mockTransactions.failed,
    isCompleted: false,
    isFailed: true,
    isInProgress: false,
    isCancelled: false,
    fromNetworkDisplayName: "Arbitrum",
    toNetworkDisplayName: "Base",
    fromNetworkExplorerUrl: "https://arbiscan.io",
    toNetworkExplorerUrl: "https://basescan.org",
  },
};

export const Cancelled: Story = {
  args: {
    transaction: mockTransactions.cancelled,
    isCompleted: false,
    isFailed: false,
    isInProgress: false,
    isCancelled: true,
    fromNetworkDisplayName: "Ethereum",
    toNetworkDisplayName: "Solana",
    fromNetworkExplorerUrl: "https://etherscan.io",
    toNetworkExplorerUrl: "https://explorer.solana.com",
  },
};

export const Retrying: Story = {
  args: {
    transaction: mockTransactions.failed,
    isCompleted: false,
    isFailed: true,
    isInProgress: false,
    isCancelled: false,
    isRetrying: true,
    fromNetworkDisplayName: "Arbitrum",
    toNetworkDisplayName: "Base",
    fromNetworkExplorerUrl: "https://arbiscan.io",
    toNetworkExplorerUrl: "https://basescan.org",
  },
};

export const Maximized: Story = {
  args: {
    transaction: mockTransactions.completed,
    isCompleted: true,
    isFailed: false,
    isInProgress: false,
    isCancelled: false,
    isMaximized: true,
    fromNetworkDisplayName: "Base",
    toNetworkDisplayName: "Ethereum",
    fromNetworkExplorerUrl: "https://basescan.org",
    toNetworkExplorerUrl: "https://etherscan.io",
  },
};

export const FastModeCompleted: Story = {
  args: {
    transaction: {
      ...mockTransactions.completed,
      transferMethod: "fast",
      providerFeeUsdc: "0.100000",
    },
    isCompleted: true,
    isFailed: false,
    isInProgress: false,
    isCancelled: false,
    fromNetworkDisplayName: "Ethereum",
    toNetworkDisplayName: "Base",
    fromNetworkExplorerUrl: "https://etherscan.io",
    toNetworkExplorerUrl: "https://basescan.org",
  },
};
