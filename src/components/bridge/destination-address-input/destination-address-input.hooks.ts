"use client";

import { useState, useEffect } from "react";
import {
  validateAddressForNetwork,
  getAddressFormatDescription,
} from "~/lib/bridge/address-validation";
import type { DestinationAddressInputProps } from "./destination-address-input.types";

export function useAddressValidation({
  networkType,
  value,
  onValidationChange,
  useCustomAddress,
}: Pick<
  DestinationAddressInputProps,
  "networkType" | "value" | "onValidationChange" | "useCustomAddress"
>) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (!useCustomAddress) {
      setValidationError(null);
      setIsValid(true);
      onValidationChange(true);
      return;
    }

    if (!value || value.trim() === "") {
      setValidationError(null);
      setIsValid(false);
      onValidationChange(false);
      return;
    }

    const validation = validateAddressForNetwork(value, networkType);
    setIsValid(validation.valid);
    setValidationError(validation.error ?? null);
    onValidationChange(validation.valid);
  }, [value, networkType, useCustomAddress, onValidationChange]);

  const formatDescription = getAddressFormatDescription(networkType);

  return {
    validationError,
    isValid,
    formatDescription,
  };
}
