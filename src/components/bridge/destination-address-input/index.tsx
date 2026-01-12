"use client";

import { useAddressValidation } from "./destination-address-input.hooks";
import { DestinationAddressInputView } from "./destination-address-input.view";
import type { DestinationAddressInputProps } from "./destination-address-input.types";

export type { DestinationAddressInputProps };

export function DestinationAddressInput({
  networkType,
  value,
  onChange,
  onValidationChange,
  useCustomAddress,
}: DestinationAddressInputProps) {
  const { validationError, isValid, formatDescription } = useAddressValidation({
    networkType,
    value,
    onValidationChange,
    useCustomAddress,
  });

  return (
    <DestinationAddressInputView
      value={value}
      onChange={onChange}
      validationError={validationError}
      isValid={isValid}
      formatDescription={formatDescription}
    />
  );
}
