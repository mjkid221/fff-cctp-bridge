# FFF CCTP Bridge

FFF (Fuck Fees Forever) Bridge is an open source Cross-Chain Transfer Protocol (CCTP) v2 interface for bridging USDC across multiple blockchain networks using Circle's Bridge Kit. If you are tired of bridges taking a cut of your USDC each time then you are in the right place. Get USDC you've asked for anytime, anywhere.

<img width="1460" height="734" alt="Screenshot 2026-01-15 at 10 39 45 PM" src="https://github.com/user-attachments/assets/eeea7bd6-8816-481f-ba71-44903653aae6" />


## Overview

FFF Bridge provides an OS-like interface for transferring USDC between EVM networks (Ethereum, Base, Arbitrum, Monad, HyperLiquid) and Solana using Circle's CCTP protocol directly. The application charges no additional fees beyond Circle's native fees on fast transfer mode (excluding gas fees user pays to submit transactions).

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
- Support for Monad via the Bridge Kit
- Optional testnet testing
- <strong><ins>Play Pong</ins></strong>

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
- Monad
- HyperEVM

**Testnet:**
- Ethereum Sepolia
- Base Sepolia
- Arbitrum Sepolia
- Solana Devnet
- Monad Testnet
- HyperEVM Testnet

Network configurations can be modified in `src/lib/bridge/networks.ts`.

## Tech Stack

- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS 4 + Radix UI
- **State Management**: Zustand with persistence
- **Storage**: IndexedDB via idb
- **Bridge SDK**: Circle Bridge Kit
- **Wallet Integration**: Dynamic Labs
- **Animation**: Motion (Framer Motion successor)

## Patches

This project includes patches to the Bridge Kit SDK to add support for networks that CCTP supports but the SDK hasn't officially added yet:

- **Monad**: Added via pnpm patches to `@circle-fin/bridge-kit`, `@circle-fin/adapter-viem-v2`, `@circle-fin/adapter-solana`. CCTP supports Monad, but the official SDK hasn't been updated yet as of v1.3.0. This patch will likely be deprecated once Circle updates the Bridge Kit SDK with official Monad support.

Patches are managed via pnpm and applied automatically on install.

## Roadmap

- **SUI Network Support**: The codebase is structured to support SUI once Circle adds it to the Bridge Kit SDK. When official support is available, SUI integration can be added with minimal changes.

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

### Security Requirements

This project uses [LavaMoat](https://github.com/LavaMoat/LavaMoat) to protect against supply chain attacks. When adding new dependencies:

1. **Run safe-install**: Always use `pnpm safe-install` instead of `pnpm install`
2. **Configure allow-scripts**: If a new dependency has install scripts, you must explicitly add it to the `lavamoat.allowScripts` section in `package.json`
   - Set to `true` if the script is required for the package to function
   - Set to `false` if the package works without running its install script
3. **CI will fail** if a dependency with lifecycle scripts is not configured

For more details, see the [LavaMoat allow-scripts documentation](https://github.com/LavaMoat/LavaMoat/blob/main/packages/allow-scripts/README.md).

### Component Guidelines

When creating new components, please follow these conventions:

**Naming Convention:**
- Use **kebab-case** for file and folder names (e.g., `bridge-card.tsx`, `transaction-status/`)
- Use **PascalCase** for component names (e.g., `BridgeCard`, `TransactionStatus`)

**Architecture Pattern:**
Follow the [Container/Presentational pattern](https://www.patterns.dev/react/presentational-container-pattern/):
- **Presentational components**: Focus on UI rendering, receive data via props, minimal logic
- **Container components**: Handle data fetching, state management, and business logic

This approach may come with some caveats (such as prop drilling and excessive re-rendering of children if implemented inadequately), but it makes it easy to create storybook stories for new components and helps with reusability.

Example structure:
```
components/
└── feature-name/
    ├── index.tsx              # Public exports
    ├── feature-name.view.tsx      # Main presentational component
    ├── feature-name.hooks.ts   # Hook with container logic (if needed)
    └── feature-name.stories.tsx  # Storybook stories
```

**Storybook:**
- Add Storybook stories for new UI components
- Run `pnpm storybook` to develop and test components in isolation
- Stories should cover different states and edge cases
- You could also automate the process with Claude or AI assisted tooling
- View the live Storybook at [fff-bridge-storybook.vercel.app](https://fff-bridge-storybook.vercel.app/)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Links

- [GitHub Repository](https://github.com/mjkid221/fff-cctp-bridge)
- [Storybook](https://fff-bridge-storybook.vercel.app/)
- [Bridge Kit Documentation](https://developers.circle.com/bridge-kit#bridge-kit)
- [Twitter](https://x.com/mjkid0)
