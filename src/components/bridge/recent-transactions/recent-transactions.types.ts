import type { BridgeTransaction, NetworkEnvironment } from "~/lib/bridge";

export interface RecentTransactionsProps {
  hideHeader?: boolean;
  /** Disable click interactions on transaction rows for now (for mobile drawer) TODO: mobile drawer interactions */
  disableClick?: boolean;
  /** Limit number of transactions shown (for mobile drawer) TODO: mobile drawer interactions */
  maxItems?: number;
}

export interface RecentTransactionsViewProps {
  filteredTransactions: BridgeTransaction[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  environment: NetworkEnvironment;
  hideHeader: boolean;
  /** Disable click interactions on transaction rows (for mobile drawer) */
  disableClick?: boolean;
  /** Limit number of transactions shown (for mobile drawer) */
  maxItems?: number;
  onOpenTransaction: (transaction: BridgeTransaction) => void;
  loadMoreRef: (node?: Element | null) => void;
}

export interface TransactionRowProps {
  transaction: BridgeTransaction;
  index: number;
  onOpenTransaction: (transaction: BridgeTransaction) => void;
  disableClick?: boolean;
}
