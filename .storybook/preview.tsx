import type { Preview } from "@storybook/nextjs-vite";
import { withThemeByClassName } from "@storybook/addon-themes";
import "./storybook.css";

/**
 * Wrapper decorator to apply proper background and text colors
 * that match the theme CSS variables.
 */
const withThemeWrapper = (Story: React.ComponentType) => (
  <div className="bg-background text-foreground min-h-screen antialiased">
    <Story />
  </div>
);

const preview: Preview = {
  decorators: [
    withThemeWrapper,
    withThemeByClassName({
      themes: {
        light: "",
        dark: "dark",
      },
      defaultTheme: "dark",
    }),
  ],
  parameters: {
    backgrounds: {
      disable: true, // Disable Storybook backgrounds, use CSS variables instead
    },
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
  },
};

export default preview;
