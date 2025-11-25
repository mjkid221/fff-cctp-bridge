import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { DynamicProvider } from "~/components/providers/dynamic-provider";

export const metadata: Metadata = {
  title: "CCTP Bridge - Cross-Chain USDC Transfer",
  description:
    "Bridge USDC across chains instantly with Circle's Cross-Chain Transfer Protocol",
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
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <TRPCReactProvider>
          <DynamicProvider>{children}</DynamicProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
