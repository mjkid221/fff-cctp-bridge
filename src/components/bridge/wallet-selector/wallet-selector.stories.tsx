import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { useRef } from "react";
import { WalletSelectorView } from "./wallet-selector.view";
import { mockWallets, mockSolanaWallets } from "~/lib/storybook/mocks";

const meta: Meta<typeof WalletSelectorView> = {
  title: "Bridge/WalletSelector",
  component: WalletSelectorView,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    label: "Source Wallet",
    placeholder: "Select a wallet",
    isOpen: false,
    setIsOpen: fn(),
    compatibleWallets: mockWallets,
    selectedWallet: undefined,
    selectedWalletId: null,
    onSelectWallet: fn(),
    networkType: "evm",
  },
  decorators: [
    (Story, context) => {
      const ref = useRef<HTMLDivElement>(null);
      return (
        <div ref={ref} className="w-80">
          <Story args={{ ...context.args, dropdownRef: ref }} />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof WalletSelectorView>;

export const Default: Story = {};

export const WithSelection: Story = {
  args: {
    selectedWallet: mockWallets[0],
    selectedWalletId: mockWallets[0]?.id ?? null,
  },
};

export const Open: Story = {
  args: {
    isOpen: true,
  },
};

export const OpenWithSelection: Story = {
  args: {
    isOpen: true,
    selectedWallet: mockWallets[1],
    selectedWalletId: mockWallets[1]?.id ?? null,
  },
};

export const EmptyNoWallets: Story = {
  args: {
    compatibleWallets: [],
    networkType: "evm",
  },
};

export const SolanaNetwork: Story = {
  args: {
    label: "Solana Wallet",
    compatibleWallets: mockSolanaWallets,
    networkType: "solana",
  },
};

export const SolanaWithSelection: Story = {
  args: {
    label: "Solana Wallet",
    compatibleWallets: mockSolanaWallets,
    selectedWallet: mockSolanaWallets[0],
    selectedWalletId: mockSolanaWallets[0]?.id ?? null,
    networkType: "solana",
  },
};

export const DestinationLabel: Story = {
  args: {
    label: "Destination Wallet",
    placeholder: "Select destination wallet",
  },
};
