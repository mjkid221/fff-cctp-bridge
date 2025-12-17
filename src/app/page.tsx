import { BridgeCard } from "~/components/bridge/bridge-card";
import { AnimatedBackground } from "~/components/bridge/animated-background";
import { BridgeHeader } from "~/components/bridge/header";
import { Footer } from "~/components/bridge/footer";
import { HydrateClient } from "~/trpc/server";

export default function Home() {
  return (
    <HydrateClient>
      <main className="relative min-h-screen">
        <AnimatedBackground />

        <div className="relative z-10 flex min-h-screen flex-col">
          <BridgeHeader />

          <div className="flex flex-1 flex-col items-center justify-center gap-12 px-4 py-12">
            <BridgeCard />
          </div>

          <Footer />
        </div>
      </main>
    </HydrateClient>
  );
}
