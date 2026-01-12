import type { NetworkType } from "~/lib/bridge/networks";

export interface DestinationAddressInputProps {
  networkType: NetworkType;
  value: string;
  onChange: (value: string) => void;
  onValidationChange: (isValid: boolean) => void;
  useCustomAddress: boolean;
  onToggleCustomAddress: (useCustom: boolean) => void;
  connectedWalletAddress?: string;
}

export interface DestinationAddressInputViewProps {
  value: string;
  onChange: (value: string) => void;
  validationError: string | null;
  isValid: boolean;
  formatDescription: string;
}
