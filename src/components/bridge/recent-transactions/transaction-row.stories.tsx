import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { TransactionRow } from "./transaction-row.view";
import { mockTransactions } from "~/lib/storybook/mocks";

const meta: Meta<typeof TransactionRow> = {
  title: "Bridge/TransactionRow",
  component: TransactionRow,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    index: 0,
    onOpenTransaction: fn(),
    disableClick: false,
  },
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TransactionRow>;

export const Pending: Story = {
  args: {
    transaction: mockTransactions.pending,
  },
};

export const InProgress: Story = {
  args: {
    transaction: mockTransactions.inProgress,
  },
};

export const Completed: Story = {
  args: {
    transaction: mockTransactions.completed,
  },
};

export const Failed: Story = {
  args: {
    transaction: mockTransactions.failed,
  },
};

export const Cancelled: Story = {
  args: {
    transaction: mockTransactions.cancelled,
  },
};

export const CompletedFastMode: Story = {
  args: {
    transaction: {
      ...mockTransactions.completed,
      transferMethod: "fast",
      providerFeeUsdc: "0.100000",
    },
  },
};

export const MobileCompact: Story = {
  args: {
    transaction: mockTransactions.completed,
    disableClick: true,
  },
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    ),
  ],
};

export const MultipleTransactions: Story = {
  render: () => (
    <div className="space-y-2">
      <TransactionRow
        transaction={mockTransactions.completed}
        index={0}
        onOpenTransaction={fn()}
      />
      <TransactionRow
        transaction={mockTransactions.inProgress}
        index={1}
        onOpenTransaction={fn()}
      />
      <TransactionRow
        transaction={mockTransactions.failed}
        index={2}
        onOpenTransaction={fn()}
      />
      <TransactionRow
        transaction={mockTransactions.pending}
        index={3}
        onOpenTransaction={fn()}
      />
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};
