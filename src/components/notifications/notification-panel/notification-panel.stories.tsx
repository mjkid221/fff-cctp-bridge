import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { useRef } from "react";
import { NotificationPanelContent } from "./notification-panel.view";
import {
  mockNotificationsList,
  mockNotifications,
} from "~/lib/storybook/mocks";

/**
 * NotificationPanelContent is the inner component without WindowPortal.
 * This allows proper rendering in Storybook without portal issues.
 */
const meta: Meta<typeof NotificationPanelContent> = {
  title: "Notifications/NotificationPanel",
  component: NotificationPanelContent,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    isOpen: true,
    notifications: [],
    onClose: fn(),
    onNotificationClick: fn(),
    onClearAll: fn(),
  },
  decorators: [
    (Story, context) => {
      const ref = useRef<HTMLDivElement>(null);
      return (
        <div className="bg-background relative h-screen w-full p-4">
          {/* Override hidden lg:block to always show panel in Storybook */}
          <style>{`.storybook-panel-override { display: block !important; position: relative !important; top: auto !important; right: auto !important; }`}</style>
          <div className="storybook-panel-override">
            <Story args={{ ...context.args, panelRef: ref }} />
          </div>
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof NotificationPanelContent>;

export const Empty: Story = {
  args: {
    notifications: [],
  },
};

export const WithNotifications: Story = {
  args: {
    notifications: mockNotificationsList,
  },
};

export const SingleNotification: Story = {
  args: {
    notifications: [mockNotifications.unreadBridgeSuccess],
  },
};

export const ManyNotifications: Story = {
  args: {
    notifications: [
      mockNotifications.unreadBridgeSuccess,
      mockNotifications.bridgeInProgress,
      mockNotifications.failedWithRetry,
      mockNotifications.readBridgeSuccess,
      mockNotifications.systemInfo,
      mockNotifications.systemWarning,
      mockNotifications.bridgePending,
      {
        ...mockNotifications.unreadBridgeSuccess,
        id: "notif-extra-1",
        title: "Another Bridge Complete",
      },
      {
        ...mockNotifications.bridgeInProgress,
        id: "notif-extra-2",
        title: "Processing Transaction",
      },
    ],
  },
};

export const AllUnread: Story = {
  args: {
    notifications: [
      mockNotifications.unreadBridgeSuccess,
      mockNotifications.bridgeInProgress,
      mockNotifications.failedWithRetry,
      mockNotifications.bridgePending,
    ],
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    notifications: mockNotificationsList,
  },
};
