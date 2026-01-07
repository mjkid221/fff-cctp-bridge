import { BridgeCard } from "~/components/bridge/bridge-card";
import { TransactionWindows } from "~/components/bridge/transaction-windows";
import { AnimatedBackground } from "~/components/bridge/animated-background";
import { BridgeHeader } from "~/components/bridge/header";
import { HydrateClient } from "~/trpc/server";

export default function Home() {
  return (
    <HydrateClient>
      <main className="relative min-h-screen">
        <AnimatedBackground />

        <div className="relative z-10 flex min-h-screen flex-col">
          <BridgeHeader />

          <div className="flex flex-1 flex-col items-center justify-center gap-12 py-12">
            <BridgeCard />
          </div>
        </div>

        {/* Multi-window transaction panels */}
        <TransactionWindows />
      </main>
    </HydrateClient>
  );
}
