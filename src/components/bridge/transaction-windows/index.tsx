"use client";

import { AnimatePresence } from "motion/react";
import { WindowPortal } from "~/components/ui/window-portal";
import {
  useTransactionWindowsState,
  useMultiWindowBridgeProgressState,
} from "./transaction-windows.hooks";
import { TransactionWindowView } from "./transaction-window.view";
import type { TransactionWindowProps } from "./transaction-windows.types";

export type { TransactionWindowProps };

function MultiWindowBridgeProgress(props: TransactionWindowProps) {
  const state = useMultiWindowBridgeProgressState(props);

  if (!state.transaction) return null;

  return <TransactionWindowView {...state} />;
}

export function TransactionWindows() {
  const {
    windows,
    closeTransactionWindow,
    focusTransactionWindow,
    updateWindowPosition,
  } = useTransactionWindowsState();

  if (windows.length === 0) return null;

  return (
    <WindowPortal>
      <AnimatePresence>
        {windows.map((window) => (
          <MultiWindowBridgeProgress
            key={window.transactionId}
            transactionWindow={window}
            onClose={() => closeTransactionWindow(window.transactionId)}
            onFocus={() => focusTransactionWindow(window.transactionId)}
            onPositionChange={(position) =>
              updateWindowPosition(window.transactionId, position)
            }
          />
        ))}
      </AnimatePresence>
    </WindowPortal>
  );
}
