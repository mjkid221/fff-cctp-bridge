"use client";

import { useEnvironment } from "~/lib/bridge";
import { useRecentTransactionsState } from "./recent-transactions.hooks";
import { RecentTransactionsView } from "./recent-transactions.view";
import type { RecentTransactionsProps } from "./recent-transactions.types";

export type { RecentTransactionsProps };

export function RecentTransactions({
  hideHeader = false,
  disableClick = false,
  maxItems,
}: RecentTransactionsProps) {
  const state = useRecentTransactionsState();

  return (
    <RecentTransactionsView
      {...state}
      hideHeader={hideHeader}
      disableClick={disableClick}
      maxItems={maxItems}
    />
  );
}

export function RecentTransactionsHeader() {
  const environment = useEnvironment();

  return (
    <div className="mb-4">
      <h3 className="text-foreground text-lg font-semibold">
        Recent Transactions
      </h3>
      <p className="text-muted-foreground mt-0.5 text-xs">
        Your latest {environment} bridge activity
      </p>
    </div>
  );
}
