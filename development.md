# Crucible: Development Hand-Off Document

This document tracks the technical execution of the Crucible project. If another AI agent needs to pick up this project, they should read this document to understand the architecture, stack, and current progress.

## Project Vision
Crucible is a decentralized proving ground and rental marketplace for autonomous DeFi agents. It features a "No-Code Agent Builder" and a "Proving Gauntlet" (Test Arena) that explicitly tests agents against strict DeFi risk parameters (max trade size, slippage, drawdown, etc.) before they are allowed on the marketplace.

## Tech Stack
- **Frontend / Backend**: Next.js 14 (App Router) with TypeScript. Tailwind CSS + Shadcn/ui for a DeepTech aesthetic.
- **Smart Contracts**: Foundry (Solidity). Deployed to Arbitrum Sepolia.
- **Web3**: Wagmi + Viem.
- **AI**: Vercel AI SDK or direct OpenAI API calls (Node.js).

## Step-by-Step Development Plan

### Step 1: Initialization & Scaffolding `[COMPLETED]`
- [x] Initialize Next.js in the root directory.
- [x] Setup Tailwind, Shadcn/ui.
- [x] Create `contracts/` directory and initialize Foundry.

### Step 2: Smart Contracts `[COMPLETED]`
- [x] Write `Crucible.sol` defining Agent Registration, Test Arenas, Staking, and Slashing.
- [x] Compiled successfully with Foundry.

### Step 3: Backend Orchestrator `[COMPLETED]`
- [x] `/api/builder`: Endpoint to save a new Agent's config.
- [x] `/api/run-arena`: The core orchestrator using Vercel AI SDK to stream SSE logs and validate DeFi constraints.

### Step 4: The DeepTech UI `[COMPLETED]`
- [x] **Dashboard**: High-tech overview of registered agents.
- [x] **Agent Builder**: Form to configure strategy and strict DeFi bounds.
- [x] **Live Test Arena**: The "wow factor" UI. A simulated market chart on the left, and a live streaming terminal on the right showing the agent's internal thoughts and Crucible's security interceptions.

## Data Required from User
To run this locally or test it, you will need to provide:
1. An **OpenAI API Key** (to be set in `.env.local` as `OPENAI_API_KEY`).
2. Your **Wallet Private Key** for smart contract deployment (to be set in `.env` inside the `contracts/` folder).
