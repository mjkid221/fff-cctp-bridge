/**
 * Error message parser for bridge transactions
 * Converts technical error messages into user-friendly text
 */

export interface ParsedError {
  userMessage: string;
  isUserRejection: boolean;
  technicalDetails?: string;
}

/**
 * Extracts the most relevant error message from technical errors
 * Supports both EVM (Ethereum, Base, Arbitrum) and Solana error formats
 * @param error - Error object or string
 * @returns Parsed error with user-friendly message
 */
export function parseTransactionError(error: unknown): ParsedError {
  const errorString = error instanceof Error ? error.message : String(error);

  // Common user rejection patterns (both EVM and Solana)
  const rejectionPatterns = [
    // EVM patterns
    "User rejected",
    "user rejected",
    "User denied",
    "user denied",
    "User cancelled",
    "user cancelled",
    "Transaction was rejected",
    "rejected by user",
    "denied transaction signature",
    "MetaMask Tx Signature: User denied",
    "ACTION_REJECTED",
    // Solana patterns
    "User rejected the request",
    "User rejected the transaction",
    "rejected the request",
    "Approval Denied",
    "wallet declined",
  ];

  const isUserRejection = rejectionPatterns.some((pattern) =>
    errorString.toLowerCase().includes(pattern.toLowerCase()),
  );

  // Extract clean error message
  let userMessage = errorString;

  // EVM-specific patterns
  // Pattern 1: Extract from "Details: <message>" (common in MetaMask/viem errors)
  const detailsMatch = /Details:\s*(.+?)(?:\s+Version:|$)/i.exec(errorString);
  if (detailsMatch?.[1]) {
    userMessage = detailsMatch[1].trim();
  }
  // Pattern 2: Extract from "Simulation failed on <chain>: <message>"
  else if (errorString.includes("Simulation failed")) {
    const simMatch =
      /Simulation failed[^:]*:\s*(.+?)(?:\s+Request Arguments:|$)/i.exec(
        errorString,
      );
    if (simMatch?.[1]) {
      userMessage = simMatch[1].trim();
    }
  }
  // Pattern 3: Extract from step errors like "approve step failed: <message>"
  else if (errorString.includes("step failed:")) {
    const stepMatch = /step failed:\s*(.+?)(?:\s+Request Arguments:|$)/i.exec(
      errorString,
    );
    if (stepMatch?.[1]) {
      userMessage = stepMatch[1].trim();
    }
  }
  // Pattern 4: Extract from EVM revert reasons
  else if (errorString.includes("execution reverted:")) {
    const revertMatch = /execution reverted:\s*(.+?)(?:\s+\(|$)/i.exec(
      errorString,
    );
    if (revertMatch?.[1]) {
      userMessage = revertMatch[1].trim();
    }
  }
  // Pattern 5: Solana program errors
  else if (errorString.includes("Program log:")) {
    const programMatch = /Program log:\s*(.+?)(?:\n|$)/i.exec(errorString);
    if (programMatch?.[1]) {
      userMessage = programMatch[1].trim();
    }
  }
  // Pattern 6: Solana transaction errors
  else if (errorString.includes("Transaction simulation failed:")) {
    const solSimMatch = /Transaction simulation failed:\s*(.+?)(?:\n|$)/i.exec(
      errorString,
    );
    if (solSimMatch?.[1]) {
      userMessage = solSimMatch[1].trim();
    }
  }

  // Clean up common technical jargon
  userMessage = userMessage
    // Remove hex data (EVM addresses and data)
    .replace(/0x[a-fA-F0-9]{8,}/g, "")
    // Remove Solana base58 addresses (start with number/letter, 32-44 chars)
    .replace(/\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g, "")
    // Remove "Request Arguments:" and everything after
    .replace(/Request Arguments:.*/i, "")
    // Remove "Version:" and everything after
    .replace(/Version:.*/i, "")
    // Remove "chain:" info
    .replace(/chain:\s*\w+\s*\([^)]+\)/gi, "")
    // Remove "from:", "to:", "data:" fields
    .replace(/(from|to|data):\s*\S+/gi, "")
    // Remove extra whitespace
    .replace(/\s+/g, " ")
    .trim();

  // Provide user-friendly message for rejections
  if (isUserRejection) {
    userMessage = "You cancelled the transaction in your wallet";
  }

  // Provide user-friendly messages for common errors
  if (userMessage.toLowerCase().includes("insufficient funds")) {
    userMessage = "Insufficient funds to complete the transaction";
  } else if (
    userMessage.toLowerCase().includes("gas") &&
    userMessage.toLowerCase().includes("too low")
  ) {
    userMessage = "Gas price too low, please try again with higher gas";
  } else if (userMessage.toLowerCase().includes("nonce")) {
    userMessage = "Transaction nonce mismatch, please try again";
  } else if (userMessage.toLowerCase().includes("already known")) {
    userMessage = "Transaction already submitted, please wait";
  } else if (
    userMessage.toLowerCase().includes("block") &&
    userMessage.toLowerCase().includes("gas limit")
  ) {
    userMessage = "Transaction requires too much gas";
  }

  // Handle JSON parsing errors (from SDK response parsing)
  if (
    userMessage.includes("JSON at position") ||
    userMessage.includes("Unterminated string")
  ) {
    userMessage =
      "Network response error - please check your transaction on the explorer";
  }

  // Handle other technical errors
  if (
    userMessage.includes("SyntaxError") ||
    userMessage.includes("Unexpected token")
  ) {
    userMessage = "Failed to process response - transaction may have succeeded";
  }

  // Fallback for empty messages
  if (!userMessage || userMessage.length < 5) {
    userMessage = isUserRejection
      ? "Transaction cancelled"
      : "Transaction failed";
  }

  return {
    userMessage,
    isUserRejection,
    technicalDetails: errorString !== userMessage ? errorString : undefined,
  };
}

/**
 * Get a step-specific error message
 * @param stepName - Name of the step (e.g., "approve", "burn")
 * @param error - Error object or string
 * @returns User-friendly error message
 */
export function parseStepError(stepName: string, error: unknown): string {
  const parsed = parseTransactionError(error);

  if (parsed.isUserRejection) {
    return `${capitalizeFirst(stepName)} cancelled: ${parsed.userMessage}`;
  }

  return `${capitalizeFirst(stepName)} failed: ${parsed.userMessage}`;
}

/**
 * Capitalize first letter of a string
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
