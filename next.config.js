/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import("next").NextConfig} */
const config = {
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@dynamic-labs/iconic",
      "@solana/web3.js",
      "viem",
      "motion",
    ],
  },
};

export default withBundleAnalyzer(config);
