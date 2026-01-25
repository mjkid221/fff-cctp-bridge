import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { useState } from "react";
import { DestinationAddressInputView } from "./destination-address-input.view";

const meta: Meta<typeof DestinationAddressInputView> = {
  title: "Bridge/DestinationAddressInput",
  component: DestinationAddressInputView,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    onChange: fn(),
    formatDescription: "EVM address (0x...)",
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DestinationAddressInputView>;

export const Empty: Story = {
  args: {
    value: "",
    isValid: false,
    validationError: null,
  },
};

export const ValidEVM: Story = {
  args: {
    value: "0x1234567890abcdef1234567890abcdef12345678",
    isValid: true,
    validationError: null,
    formatDescription: "EVM address (0x...)",
  },
};

export const InvalidEVM: Story = {
  args: {
    value: "0x123",
    isValid: false,
    validationError:
      "Invalid EVM address format. Must be 42 characters starting with 0x.",
    formatDescription: "EVM address (0x...)",
  },
};

export const ValidSolana: Story = {
  args: {
    value: "7nYBp9LGy4oPzXwMq8rJh2kFtNv3sAeW1cDuE6fZ4oPz",
    isValid: true,
    validationError: null,
    formatDescription: "Solana address",
  },
};

export const InvalidSolana: Story = {
  args: {
    value: "invalid-solana-address",
    isValid: false,
    validationError: "Invalid Solana address format.",
    formatDescription: "Solana address",
  },
};

export const Typing: Story = {
  args: {
    value: "0x1234",
    isValid: false,
    validationError: "Address is incomplete.",
    formatDescription: "EVM address (0x...)",
  },
};

export const Interactive: Story = {
  render: function InteractiveInput() {
    const [value, setValue] = useState("");

    const validateEVM = (addr: string) => {
      if (!addr) return { isValid: false, error: null };
      if (!addr.startsWith("0x")) {
        return { isValid: false, error: "Must start with 0x" };
      }
      if (addr.length < 42) {
        return { isValid: false, error: "Address is incomplete" };
      }
      if (addr.length === 42 && /^0x[a-fA-F0-9]{40}$/.test(addr)) {
        return { isValid: true, error: null };
      }
      return { isValid: false, error: "Invalid address format" };
    };

    const { isValid, error } = validateEVM(value);

    return (
      <DestinationAddressInputView
        value={value}
        onChange={setValue}
        isValid={isValid}
        validationError={error}
        formatDescription="EVM address (0x...)"
      />
    );
  },
};
