import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { RecentTransactionsView } from "./recent-transactions.view";
import { mockTransactionsList, mockTransactions } from "~/lib/storybook/mocks";

const meta: Meta<typeof RecentTransactionsView> = {
  title: "Bridge/RecentTransactions",
  component: RecentTransactionsView,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    environment: "mainnet",
    hideHeader: false,
    disableClick: false,
    onOpenTransaction: fn(),
    loadMoreRef: fn(),
    isFetchingNextPage: false,
    hasNextPage: true,
  },
  decorators: [
    (Story) => (
      <div className="w-[600px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RecentTransactionsView>;

export const Loading: Story = {
  args: {
    filteredTransactions: [],
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    filteredTransactions: [],
    isLoading: false,
  },
};

export const EmptyTestnet: Story = {
  args: {
    filteredTransactions: [],
    isLoading: false,
    environment: "testnet",
  },
};

export const WithTransactions: Story = {
  args: {
    filteredTransactions: mockTransactionsList,
    isLoading: false,
  },
};

export const WithHeader: Story = {
  args: {
    filteredTransactions: mockTransactionsList,
    isLoading: false,
    hideHeader: false,
  },
};

export const WithoutHeader: Story = {
  args: {
    filteredTransactions: mockTransactionsList,
    isLoading: false,
    hideHeader: true,
  },
};

export const MobileCompact: Story = {
  args: {
    filteredTransactions: mockTransactionsList,
    isLoading: false,
    hideHeader: true,
    disableClick: true,
    maxItems: 3,
  },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
};

export const LoadingMore: Story = {
  args: {
    filteredTransactions: mockTransactionsList,
    isLoading: false,
    isFetchingNextPage: true,
    hasNextPage: true,
  },
};

export const NoMoreTransactions: Story = {
  args: {
    filteredTransactions: mockTransactionsList,
    isLoading: false,
    isFetchingNextPage: false,
    hasNextPage: false,
  },
};

export const SingleTransaction: Story = {
  args: {
    filteredTransactions: [mockTransactions.completed],
    isLoading: false,
  },
};

export const TestnetEnvironment: Story = {
  args: {
    filteredTransactions: mockTransactionsList,
    isLoading: false,
    environment: "testnet",
  },
};
