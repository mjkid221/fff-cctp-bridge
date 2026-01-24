export interface StatsWindowProps {
  onClose: () => void;
}

export interface StatsWindowViewProps {
  panelRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  // Stats data
  stats: BridgeStats;
  isLoading: boolean;
}

export interface BridgeStats {
  totalBridged: string;
  totalTransactions: number;
  totalFeesPaid: string;
  estimatedSavings: string;
  fastTransactions: number;
  standardTransactions: number;
}
