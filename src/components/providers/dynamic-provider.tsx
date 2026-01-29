"use client";

import { useEffect } from "react";
import {
  DynamicContextProvider,
  FilterChain,
} from "@dynamic-labs/sdk-react-core";

import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { SolanaWalletConnectors } from "@dynamic-labs/solana";
import { env } from "~/env";
import { EthereumIcon, SolanaIcon, ArbitrumIcon } from "@dynamic-labs/iconic";

import { WalletProvider } from "~/lib/wallet/wallet-context";
import {
  useDynamicWalletContext,
  DynamicWalletAdapter,
} from "~/lib/wallet/providers/dynamic";
import { WalletProviderRegistry } from "~/lib/wallet/provider-registry";

/**
 * Bridge component that connects Dynamic's context to the unified wallet context
 */
function WalletContextBridge({ children }: { children: React.ReactNode }) {
  // Register Dynamic adapter on mount
  useEffect(() => {
    if (!WalletProviderRegistry.hasAdapter()) {
      WalletProviderRegistry.register(new DynamicWalletAdapter());
    }
  }, []);

  // Bridge Dynamic's context to our unified context
  const walletContext = useDynamicWalletContext();

  return <WalletProvider value={walletContext}>{children}</WalletProvider>;
}

export const DynamicProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: env.NEXT_PUBLIC_DYNAMIC_PROJECT_ID,
        walletConnectors: [
          EthereumWalletConnectors,
          SolanaWalletConnectors,
          // Re-add SUI back in the future
          // SuiWalletConnectors,
        ],
        overrides: {
          views: [
            {
              type: "wallet-list",
              tabs: {
                items: [
                  {
                    label: { text: "All chains" },
                  },
                  {
                    label: { icon: <EthereumIcon /> },
                    walletsFilter: FilterChain("EVM"),
                    recommendedWallets: [
                      {
                        walletKey: "phantomevm",
                      },
                    ],
                  },
                  {
                    label: { icon: <SolanaIcon /> },
                    walletsFilter: FilterChain("SOL"),
                  },
                  {
                    label: { icon: <ArbitrumIcon /> },
                    walletsFilter: FilterChain("EVM"),
                  },
                  // TO re-add SUI back in the future
                  // {
                  //   label: { icon: <SuiIcon /> },
                  //   walletsFilter: FilterChain("SUI"),
                  // },
                ],
              },
            },
          ],
        },
        // Disable SIWE (and SIWS), we don't need it for our use case. (And also bypasses Dynamic's MAU limits hehe)
        initialAuthenticationMode: "connect-only",
      }}
    >
      <WalletContextBridge>{children}</WalletContextBridge>
    </DynamicContextProvider>
  );
};
