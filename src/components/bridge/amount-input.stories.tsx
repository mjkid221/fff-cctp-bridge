import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { useState } from "react";
import { AmountInput } from "./amount-input";

const meta: Meta<typeof AmountInput> = {
  title: "Bridge/AmountInput",
  component: AmountInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    label: "Amount",
    onChange: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AmountInput>;

export const Default: Story = {
  args: {
    value: "",
    balance: "1,234.56",
  },
};

export const WithValue: Story = {
  args: {
    value: "100.00",
    balance: "1,234.56",
  },
};

export const LargeValue: Story = {
  args: {
    value: "10,000.00",
    balance: "25,000.00",
  },
};

export const SmallBalance: Story = {
  args: {
    value: "",
    balance: "0.50",
  },
};

export const ZeroBalance: Story = {
  args: {
    value: "",
    balance: "0.00",
  },
};

export const DecimalValue: Story = {
  args: {
    value: "123.456789",
    balance: "500.00",
  },
};

export const Interactive: Story = {
  render: function InteractiveAmountInput() {
    const [value, setValue] = useState("");
    const balance = "1,000.00";

    return (
      <AmountInput
        label="Amount"
        value={value}
        onChange={setValue}
        balance={balance}
      />
    );
  },
};

export const MaxAmount: Story = {
  args: {
    value: "1,234.56",
    balance: "1,234.56",
  },
};
