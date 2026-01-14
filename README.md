# FFF CCTP Bridge

FFF (Finally Fucking Free) Bridge is an open source Cross-Chain Transfer Protocol (CCTP) v2 interface for bridging USDC across multiple blockchain networks using Circle's Bridge Kit.

## Overview

FFF Bridge provides a user-friendly interface for transferring USDC between EVM networks (Ethereum, Base, Arbitrum, Monad, HyperLiquid) and Solana using Circle's CCTP protocol. The application charges no additional fees beyond Circle's native fees on fast transfer mode.

Key principles:
- **Offline-first architecture** - Transaction history is stored locally using IndexedDB
- **Minimal friction** - Easy to fork and get started with your own deployment
- **Provider-agnostic design** - Wallet provider can be swapped by implementing the IWallet interface

## Features

- Cross-chain USDC transfers between EVM chains and Solana
- Support for both mainnet and testnet environments
- Persistent transaction history with step-by-step progress tracking
- Multi-wallet support via Dynamic Labs
- Real-time fee estimation
- Retry capability for failed transactions
- Responsive UI with light/dark theme support
- Support for Monad via the Bridge Kit.
- Play Pong.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- pnpm package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mjkid221/fff-cctp-bridge.git
   cd cctp-bridge
   ```

2. Copy the environment example file:
   ```bash
   cp .env.example .env
   ```

3. Get your Dynamic API key:
   - Visit https://app.dynamic.xyz/
   - Create a project and obtain your Environment ID
   - Add it to your `.env` file as `NEXT_PUBLIC_DYNAMIC_PROJECT_ID`

4. Install dependencies:
   ```bash
   pnpm install
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

The application will be available at `http://localhost:3000`.

## Architecture

```
src/
├── app/                          # Next.js App Router
├── components/
│   └── bridge/                   # Bridge UI components
│       ├── bridge-card/          # Main bridge form
│       ├── header/               # Navigation and controls
│       └── transaction-windows/  # Transaction status displays
├── lib/
│   ├── bridge/                   # Core bridge logic
│   │   ├── service.ts           # Bridge service implementation
│   │   ├── store.ts             # Zustand state management
│   │   ├── storage.ts           # IndexedDB persistence
│   │   └── networks.ts          # Network configurations
│   ├── wallet/                   # Wallet provider abstraction
│   │   ├── types.ts             # IWallet, IWalletContext interfaces
│   │   └── providers/           # Provider implementations
│   └── solana/                   # Solana-specific utilities
```

## Customization

### Wallet Provider

The application uses Dynamic Labs for wallet connections by default. If you want to use a different wallet provider (RainbowKit, Privy, etc.), you can implement the `IWallet` interface defined in `src/lib/wallet/types.ts`.

Key interfaces to implement:
- `IWallet` - Represents a connected wallet with chain-specific provider access
- `IWalletContext` - React context interface for wallet state and actions
- `IWalletProviderAdapter` - Adapter for converting provider-specific wallet types

See `src/lib/wallet/providers/dynamic/` for a reference implementation.

### Supported Networks

The bridge supports the following networks:

**Mainnet:**
- Ethereum
- Base
- Arbitrum
- Solana

**Testnet:**
- Ethereum Sepolia
- Base Sepolia
- Arbitrum Sepolia
- Solana Devnet

Network configurations can be modified in `src/lib/bridge/networks.ts`.

## Tech Stack

- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS 4 + Radix UI
- **State Management**: Zustand with persistence
- **Storage**: IndexedDB via idb
- **Bridge SDK**: Circle Bridge Kit
- **Wallet Integration**: Dynamic Labs
- **Animation**: Motion (Framer Motion successor)

## Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript compiler check
pnpm test         # Run tests
```

## Contributing

Contributions are welcome. Please open an issue to discuss proposed changes before submitting a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Links

- [GitHub Repository](https://github.com/mjkid221/fff-cctp-bridge)
- [Bridge Kit Documentation](https://developers.circle.com/bridge-kit#bridge-kit)
- [Twitter](https://x.com/mjkid0)
