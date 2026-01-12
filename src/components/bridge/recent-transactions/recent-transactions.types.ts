import type { BridgeTransaction, NetworkEnvironment } from "~/lib/bridge";

export interface RecentTransactionsProps {
  hideHeader?: boolean;
}

export interface RecentTransactionsViewProps {
  filteredTransactions: BridgeTransaction[];
  isLoading: boolean;
  environment: NetworkEnvironment;
  hideHeader: boolean;
  onOpenTransaction: (transaction: BridgeTransaction) => void;
}

export interface TransactionRowProps {
  transaction: BridgeTransaction;
  index: number;
  onOpenTransaction: (transaction: BridgeTransaction) => void;
}
