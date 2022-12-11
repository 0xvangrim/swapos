<img width="1920" alt="meta_swapos" src="https://user-images.githubusercontent.com/34306844/206903178-8206bd5a-779d-4de4-bd5c-37ade5d05086.png">

# SwapOS

**A trustless peer-to-peer swap protocol**

SwapOS is a minimalistic peer-to-peer protocol enabling ERC20-token transfers cross-chain using Hyperlane. Currently, our implementation is a proof-of-concept to support EVM-based chains. 

Going forward, SwapOS has the potential to expand beyond EVM's into (1) traditional finance / fiat transfers and (2) other chains (e.g. Bitcoin, Solana, and Gnosis). Swapping tokens cross-chains and without a middleman has never been easier.

## Get started

To run SwapOS locally, install dependencies.

```bash
pnpm install
```

Copy & fill environments.

```bash
cp packages/frontend/.env.local.example packages/frontend/.env.local
cp packages/contracts/.env.example packages/contracts/.env
```

Generate contract-types, start local hardhat node, and start frontend with turborepo (from root-dir).

```bash
pnpm dev
```

Just start frontend (from root-dir).

```bash
pnpm frontend:dev
```

## Tech stack

- Package-Manager: `pnpm`
- Monorepo Tooling: `turborepo`
- Smart Contract Development: `hardhat`
  - Deploy & Address-Export: `hardhat-deploy`
  - Typescript-Types: `typechain`
- Frontend: `next`
  - Contract Interactions: `wagmi`, `rainbowkit`
  - Styling: `chakra`, `tailwindcss`, `twin.macro`, `emotion`
- Miscellaneous:
  - Linting & Formatting: `eslint`, `prettier`, `husky`, `lint-staged`
