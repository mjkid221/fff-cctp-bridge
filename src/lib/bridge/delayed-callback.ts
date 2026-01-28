/**
 * Execute a callback after a delay, gated by a condition.
 *
 * Useful when an async side-effect (e.g. IndexedDB write fired via
 * queueMicrotask) must flush before the callback runs.
 */
export function delayedCallback(
  condition: boolean,
  callback: () => void,
  delayMs = 500,
): void {
  if (condition) {
    setTimeout(callback, delayMs);
  }
}
