import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { useState } from "react";
import { TransferMethodToggle } from "./transfer-method-toggle";
import type { TransferMethod } from "~/lib/bridge";

const meta: Meta<typeof TransferMethodToggle> = {
  title: "Bridge/TransferMethodToggle",
  component: TransferMethodToggle,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
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
type Story = StoryObj<typeof TransferMethodToggle>;

export const Standard: Story = {
  args: {
    value: "standard",
  },
};

export const Fast: Story = {
  args: {
    value: "fast",
  },
};

export const Interactive: Story = {
  render: function InteractiveToggle() {
    const [value, setValue] = useState<TransferMethod>("standard");

    return (
      <div className="space-y-4">
        <TransferMethodToggle value={value} onChange={setValue} />
        <p className="text-muted-foreground text-center text-sm">
          Selected: {value}
        </p>
      </div>
    );
  },
};

export const Narrow: Story = {
  args: {
    value: "standard",
  },
  decorators: [
    (Story) => (
      <div className="w-60">
        <Story />
      </div>
    ),
  ],
};

export const Wide: Story = {
  args: {
    value: "fast",
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};
