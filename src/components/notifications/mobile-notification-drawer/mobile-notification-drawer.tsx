"use client";

import { AnimatePresence } from "motion/react";
import { useIsNotificationPanelOpen } from "~/lib/notifications";
import { useMobileNotificationDrawerState } from "./mobile-notification-drawer.hooks";
import { MobileNotificationDrawerView } from "./mobile-notification-drawer.view";
import type { MobileNotificationDrawerProps } from "./mobile-notification-drawer.types";

export function MobileNotificationDrawer(props: MobileNotificationDrawerProps) {
  const isOpen = useIsNotificationPanelOpen();
  const state = useMobileNotificationDrawerState(props);

  return (
    <AnimatePresence>
      {isOpen && <MobileNotificationDrawerView {...state} />}
    </AnimatePresence>
  );
}
