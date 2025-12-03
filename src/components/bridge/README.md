# Bridge UI Components

## Component Hierarchy

```
Page (src/app/page.tsx)
├── AnimatedBackground
├── BridgeHeader
│   └── Dynamic Wallet Button
├── Main Content
│   ├── BridgeCard
│   │   ├── ChainSelector (From)
│   │   ├── AmountInput
│   │   ├── SwapButton
│   │   ├── ChainSelector (To)
│   │   └── Bridge Button
│   ├── StatsCard
│   └── Features
└── Footer
```

## Quick Start

```tsx
// Import all components
import {
  BridgeCard,
  AnimatedBackground,
  BridgeHeader,
  StatsCard,
  Features,
  Footer,
} from '~/components/bridge';

// Use in your page
export default function Page() {
  return (
    <main className="relative min-h-screen">
      <AnimatedBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <BridgeHeader />
        <div className="flex flex-1 flex-col items-center justify-center gap-12 px-4 py-12">
          <BridgeCard />
          <StatsCard />
          <Features />
        </div>
        <Footer />
      </div>
    </main>
  );
}
```



