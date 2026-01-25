import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { useRef, useState } from "react";
import { ThemeToggleView } from "./theme-toggle.view";

const meta: Meta<typeof ThemeToggleView> = {
  title: "Bridge/ThemeToggle",
  component: ThemeToggleView,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    mounted: true,
    toggleTheme: fn(),
  },
  decorators: [
    (Story) => {
      const ref = useRef<HTMLButtonElement>(null);
      return <Story args={{ buttonRef: ref }} />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof ThemeToggleView>;

export const Light: Story = {
  args: {
    isDark: false,
  },
};

export const Dark: Story = {
  args: {
    isDark: true,
  },
};

export const NotMounted: Story = {
  args: {
    mounted: false,
    isDark: false,
  },
};

export const Interactive: Story = {
  render: function InteractiveThemeToggle() {
    const ref = useRef<HTMLButtonElement>(null);
    const [isDark, setIsDark] = useState(true);

    return (
      <div className="flex flex-col items-center gap-4">
        <ThemeToggleView
          buttonRef={ref}
          mounted={true}
          isDark={isDark}
          toggleTheme={() => setIsDark(!isDark)}
        />
        <p className="text-muted-foreground text-sm">
          Theme: {isDark ? "Dark" : "Light"}
        </p>
      </div>
    );
  },
};

export const InHeader: Story = {
  args: {
    isDark: true,
  },
  decorators: [
    (Story) => {
      const ref = useRef<HTMLButtonElement>(null);
      return (
        <div className="bg-background border-border flex items-center gap-2 rounded-lg border p-2">
          <span className="text-muted-foreground text-xs">Settings</span>
          <Story args={{ buttonRef: ref }} />
        </div>
      );
    },
  ],
};
