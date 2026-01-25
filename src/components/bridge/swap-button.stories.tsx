import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { SwapButton } from "./swap-button";

const meta: Meta<typeof SwapButton> = {
  title: "Bridge/SwapButton",
  component: SwapButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    onSwap: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof SwapButton>;

export const Default: Story = {};

export const WithContext: Story = {
  decorators: [
    (Story) => (
      <div className="flex flex-col items-center gap-4">
        <div className="bg-muted/30 border-border/50 h-20 w-80 rounded-2xl border" />
        <Story />
        <div className="bg-muted/30 border-border/50 h-20 w-80 rounded-2xl border" />
      </div>
    ),
  ],
};

export const Interactive: Story = {
  render: function InteractiveSwapButton() {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="bg-card border-border/50 flex w-80 items-center justify-center rounded-2xl border p-4">
          <span className="text-muted-foreground text-sm">From: Ethereum</span>
        </div>
        <SwapButton onSwap={() => alert("Swapped!")} />
        <div className="bg-card border-border/50 flex w-80 items-center justify-center rounded-2xl border p-4">
          <span className="text-muted-foreground text-sm">To: Base</span>
        </div>
      </div>
    );
  },
};
