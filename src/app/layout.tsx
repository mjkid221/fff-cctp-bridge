import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { DynamicProvider } from "~/components/providers/dynamic-provider";
import { RootScrollArea } from "~/components/ui/scroll-area";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.fff-bridge.com"),
  title: "FFF CCTP Bridge - Cross-Chain USDC Transfer",
  description:
    "Bridge USDC across chains instantly with Circle's Cross-Chain Transfer Protocol. Fast, secure transfers between Ethereum, Base, Arbitrum, and Solana.",
  keywords: [
    "USDC",
    "bridge",
    "CCTP",
    "cross-chain",
    "Ethereum",
    "Solana",
    "Base",
    "Arbitrum",
    "Circle",
    "Monad",
    "HyperLiquid",
  ],
  openGraph: {
    title: "FFF CCTP Bridge - Cross-Chain USDC Transfer",
    description:
      "Bridge USDC across chains instantly with Circle's Cross-Chain Transfer Protocol",
    url: "https://www.fff-bridge.com",
    siteName: "FFF CCTP Bridge",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "FFF CCTP Bridge - Cross-Chain USDC Transfer",
    description:
      "Bridge USDC across chains instantly with Circle's Cross-Chain Transfer Protocol",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`} suppressHydrationWarning>
      <body>
        <TRPCReactProvider>
          <DynamicProvider>
            <RootScrollArea>{children}</RootScrollArea>
          </DynamicProvider>
        </TRPCReactProvider>
        <Analytics />
      </body>
    </html>
  );
}
