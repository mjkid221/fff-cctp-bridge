/**
 * Circle IRIS Attestation API client
 *
 * Used to fetch attestations directly from Circle's IRIS service
 * for recovering stuck transactions after page refresh.
 *
 * IRIS API Docs: https://developers.circle.com/stablecoins/reference/getattestation
 */

const IRIS_API = {
  mainnet: "https://iris-api.circle.com",
  testnet: "https://iris-api-sandbox.circle.com",
} as const;

/**
 * Attestation message returned from IRIS API
 */
export interface AttestationMessage {
  message: string; // Raw message bytes for receiveMessage
  eventNonce: string; // Event nonce
  attestation: string; // Circle's cryptographic signature
  status: "complete" | "pending" | "expired";
  decodedMessage: {
    nonce: string;
    sourceDomain: string;
    destinationDomain: string;
    sender: string;
    recipient: string;
    decodedMessageBody: {
      amount: string;
      burnToken: string;
      mintRecipient: string;
      depositor: string;
      destinationCaller: string;
    };
  };
}

/**
 * IRIS API response structure
 */
interface IrisResponse {
  messages?: AttestationMessage[];
  error?: string;
}

/**
 * Fetch attestation from Circle's IRIS API
 *
 * Attestation can take 15-30+ minutes depending on network conditions.
 * This function polls indefinitely until the attestation is ready.
 *
 * @param sourceDomain - CCTP domain ID of the source chain (NOT chain ID)
 * @param burnTxHash - Transaction hash of the burn transaction
 * @param isTestnet - Whether to use testnet or mainnet API
 * @param retryDelayMs - Delay between retries in milliseconds (default: 5000)
 * @param onProgress - Optional callback for progress updates
 * @returns Attestation message if found and complete, null only if expired and re-attestation fails
 */
export async function fetchAttestation(
  sourceDomain: number,
  burnTxHash: string,
  isTestnet: boolean,
  retryDelayMs = 5000,
  onProgress?: (attempt: number) => void,
): Promise<AttestationMessage | null> {
  const baseUrl = isTestnet ? IRIS_API.testnet : IRIS_API.mainnet;
  const url = `${baseUrl}/v2/messages/${sourceDomain}?transactionHash=${burnTxHash}`;

  console.log("[Attestation] Fetching attestation (polling indefinitely)", {
    sourceDomain,
    burnTxHash,
    isTestnet,
    url,
  });

  let attempt = 0;
  while (true) {
    attempt++;

    // Call progress callback if provided
    if (onProgress) {
      onProgress(attempt);
    }

    // Log progress every 12 attempts (~1 minute at 5s intervals) to reduce verbosity
    const shouldLog = attempt === 1 || attempt % 12 === 0;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        if (shouldLog) {
          console.log(
            `[Attestation] Attempt ${attempt}: HTTP ${response.status}`,
          );
        }
        await sleep(retryDelayMs);
        continue;
      }

      const data = (await response.json()) as IrisResponse;

      if (data.messages && data.messages.length > 0) {
        const attestationResult = data.messages[0];

        if (attestationResult) {
          // Always log when we get a status update
          console.log("[Attestation] Found attestation", {
            status: attestationResult.status,
            hasAttestation: !!attestationResult.attestation,
            attempt,
          });

          if (
            attestationResult.status === "complete" &&
            attestationResult.attestation
          ) {
            return attestationResult;
          }

          // If pending, continue polling
          if (attestationResult.status === "pending") {
            await sleep(retryDelayMs);
            continue;
          }

          // If expired, return so caller can handle re-attestation
          if (attestationResult.status === "expired") {
            return attestationResult;
          }
        }
      }

      // No messages yet, keep polling
      if (shouldLog) {
        console.log(
          `[Attestation] Attempt ${attempt}: Waiting for attestation...`,
        );
      }
      await sleep(retryDelayMs);
    } catch (error) {
      if (shouldLog) {
        console.error(`[Attestation] Attempt ${attempt} error:`, error);
      }
      await sleep(retryDelayMs);
    }
  }
}

/**
 * Request re-attestation for an expired attestation
 *
 * @param nonce - The nonce from the decoded message
 * @param isTestnet - Whether to use testnet or mainnet API
 * @returns true if re-attestation request was successful
 */
export async function requestReAttestation(
  nonce: string,
  isTestnet: boolean,
): Promise<boolean> {
  const baseUrl = isTestnet ? IRIS_API.testnet : IRIS_API.mainnet;
  const url = `${baseUrl}/v2/reattest/${nonce}`;

  console.log("[Attestation] Requesting re-attestation", { nonce, isTestnet });

  try {
    const response = await fetch(url, {
      method: "POST",
    });

    console.log("[Attestation] Re-attestation response:", response.status);
    return response.ok;
  } catch (error) {
    console.error("[Attestation] Re-attestation error:", error);
    return false;
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
