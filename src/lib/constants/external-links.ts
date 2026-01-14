/**
 * External links used throughout the application.
 * Centralized here for easy maintenance and updates.
 */

export const EXTERNAL_LINKS = {
  // Faucets
  CIRCLE_FAUCET: "https://faucet.circle.com/",

  // Social & Creator
  GITHUB_REPO: "https://github.com/mjkid221/fff-cctp-bridge",
  CREATOR_X: "https://x.com/mjkid0",

  // Documentation
  BRIDGE_KIT_DOCS: "https://developers.circle.com/bridge-kit#bridge-kit",
} as const;

export type ExternalLinkKey = keyof typeof EXTERNAL_LINKS;
