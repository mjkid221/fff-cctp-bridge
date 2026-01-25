import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react";
import { NotificationItemView } from "./notification-item.view";
import { mockNotifications } from "~/lib/storybook/mocks";

const meta: Meta<typeof NotificationItemView> = {
  title: "Notifications/NotificationItem",
  component: NotificationItemView,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    onItemClick: fn(),
    onDismiss: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NotificationItemView>;

export const UnreadBridgeSuccess: Story = {
  args: {
    notification: mockNotifications.unreadBridgeSuccess,
    formattedTimestamp: "5m ago",
    statusIcon: <CheckCircle2 className="size-5 text-green-500" />,
  },
};

export const ReadBridgeSuccess: Story = {
  args: {
    notification: mockNotifications.readBridgeSuccess,
    formattedTimestamp: "2h ago",
    statusIcon: <CheckCircle2 className="size-5 text-green-500" />,
  },
};

export const BridgePending: Story = {
  args: {
    notification: mockNotifications.bridgePending,
    formattedTimestamp: "Just now",
    statusIcon: <Clock className="size-5 animate-pulse text-yellow-500" />,
  },
};

export const BridgeInProgress: Story = {
  args: {
    notification: mockNotifications.bridgeInProgress,
    formattedTimestamp: "2m ago",
    statusIcon: <Loader2 className="size-5 animate-spin text-blue-500" />,
  },
};

export const FailedWithRetryAction: Story = {
  args: {
    notification: mockNotifications.failedWithRetry,
    formattedTimestamp: "10m ago",
    statusIcon: <XCircle className="size-5 text-red-500" />,
  },
};

export const SystemInfo: Story = {
  args: {
    notification: mockNotifications.systemInfo,
    formattedTimestamp: "1d ago",
    statusIcon: <Info className="size-5 text-gray-500" />,
  },
};

export const SystemWarning: Story = {
  args: {
    notification: mockNotifications.systemWarning,
    formattedTimestamp: "30m ago",
    statusIcon: <AlertTriangle className="size-5 text-amber-500" />,
  },
};

export const MultipleNotifications: Story = {
  render: () => (
    <div className="space-y-2">
      <NotificationItemView
        notification={mockNotifications.unreadBridgeSuccess}
        formattedTimestamp="5m ago"
        statusIcon={<CheckCircle2 className="size-5 text-green-500" />}
        onItemClick={fn()}
        onDismiss={fn()}
      />
      <NotificationItemView
        notification={mockNotifications.bridgeInProgress}
        formattedTimestamp="2m ago"
        statusIcon={<Loader2 className="size-5 animate-spin text-blue-500" />}
        onItemClick={fn()}
        onDismiss={fn()}
      />
      <NotificationItemView
        notification={mockNotifications.failedWithRetry}
        formattedTimestamp="10m ago"
        statusIcon={<XCircle className="size-5 text-red-500" />}
        onItemClick={fn()}
        onDismiss={fn()}
      />
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
};
