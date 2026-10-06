# Scorpion Wallet

A modern, mobile-responsive crypto wallet web app built with Next.js. Create or import an Ethereum wallet directly in the browser — deposit crypto, stake for daily rewards, send tokens, and claim daily check-in bonuses. Fully white-label: rename, rebrand, and deploy your own version with environment variables alone.

Default brand: **Scorp Wallet** (configurable).

---

## Features

- **Wallet creation & import** — Generate a new Ethereum wallet or import an existing one via private key. Keys never leave the browser.
- **Token deposits** — Buy tokens with USDT, BTC, or SOL at configurable exchange rates. Deposit addresses and rates are set via env vars.
- **Staking** — Stake tokens to earn 2% APR, with rewards accruing daily and claimable at any time.
- **Send tokens** — Transfer tokens to any address with optional notes and automatic 2% cashback.
- **Daily check-in** — Claim escalating daily rewards (5 → 8 → 12 → 18 → 25 → 35 → 60 tokens) with a streak system.
- **Activity log** — Full transaction history with type icons (send, receive, deposit, stake, unstake, reward, check-in).
- **Anti-bot protection** — Honeypot field, minimum fill delay, signed proof-of-work challenge, and user-agent heuristics.
- **Rate limiting** — Burst, sensitive-endpoint, and global rate limits via `rate-limiter-flexible`.
- **Telegram notifications** — Optional deposit/transaction alerts sent to a Telegram chat.
- **Full white-label** — App name, token symbol, tagline, deposit addresses, and conversion rates are all configurable via environment variables.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) + TypeScript |
| UI | [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Wallet | [ethers.js v6](https://docs.ethers.org/v6/) (client-side key generation — no keys sent to server) |
| HTTP | [Axios](https://axios-http.com/) |
| Rate Limiting | [rate-limiter-flexible](https://github.com/animir/node-rate-limiter-flexible) |
| Anti-Bot | Custom proof-of-work + honeypot + timing + UA heuristics |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and **npm** (or yarn/pnpm)

### Installation

```bash
git clone https://github.com/scorpionK4L4/scorpion.git
cd scorpion/wallet
npm install
```

### Configuration

Copy the example env file and customize it:

```bash
cp .env.example .env.local
```

All settings have sensible defaults for local development. See [Environment Variables](#environment-variables) for the full list.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
npm start
```

---

## Environment Variables

Create a `.env.local` file in the `wallet/` directory. All variables are optional for local dev.

### Branding

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_APP_NAME` | `Scorp` | App name shown in header, onboarding, and page title |
| `NEXT_PUBLIC_APP_TAGLINE` | `2% APR on every stake` | Meta description tagline |
| `NEXT_PUBLIC_APP_TOKEN_SYMBOL` | `SCORP` | Token symbol displayed on balance card and forms |

### Deposit Conversion Rates

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_DEPOSIT_RATE_USDT` | `10` | SCORP per 1 USDT |
| `NEXT_PUBLIC_DEPOSIT_RATE_BTC` | `600000` | SCORP per 1 BTC |
| `NEXT_PUBLIC_DEPOSIT_RATE_SOL` | `1500` | SCORP per 1 SOL |

### Deposit Addresses

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_DEPOSIT_ADDRESS_USDT` | `0x000...000` | ERC-20 USDT deposit address |
| `NEXT_PUBLIC_DEPOSIT_ADDRESS_BTC` | `bc1q...wlh` | BTC deposit address |
| `NEXT_PUBLIC_DEPOSIT_ADDRESS_SOL` | `111...111` | SOL deposit address |

### Server Secrets

| Variable | Default | Description |
|----------|---------|-------------|
| `BOT_GUARD_SECRET` | `change-me...` | HMAC secret for anti-bot challenges. **Must be a long random string in production.** |

### Telegram Notifications (Optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `TELEGRAM_BOT_TOKEN` | *(empty)* | Bot token from [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_CHAT_ID` | *(empty)* | Chat ID for deposit/transaction notifications |

---

## Project Structure

```
wallet/
├── public/
│   └── icon.svg              # App logo (replace to rebrand)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── challenge/     # Issues proof-of-work challenges
│   │   │   ├── checkin/       # Daily check-in claims
│   │   │   ├── deposit/       # Deposit initiation & confirmation
│   │   │   ├── send/          # Token transfers
│   │   │   ├── stake/         # Stake, unstake, claim rewards
│   │   │   └── wallet/        # Wallet state lookup
│   │   ├── globals.css        # Tailwind base + custom styles
│   │   ├── layout.tsx         # Root layout with metadata
│   │   └── page.tsx           # Entry point (onboarding or dashboard)
│   ├── components/
│   │   ├── ui/                # shadcn/ui primitives (button, card, dialog, etc.)
│   │   └── wallet/            # App components (dashboard, onboarding, deposit, stake, check-in)
│   └── lib/
│       ├── api.ts             # Axios client + challenge solver
│       ├── bot-guard.ts       # Server-side anti-bot verification
│       ├── config.ts          # Centralized env-driven config
│       ├── rate-limit.ts      # Rate limiter setup
│       ├── request-types.ts   # Shared request/response types
│       ├── telegram.ts        # Telegram notification helper
│       ├── utils.ts           # Formatting & utility functions
│       ├── wallet-client.ts   # Client-side wallet (ethers.js, localStorage)
│       └── wallet-store.ts    # In-memory server-side ledger (demo)
├── .env.example               # All env vars with descriptions
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## How It Works

1. **Onboarding** — The user creates a new wallet (ethers.js generates a random keypair) or imports an existing private key. The key is stored in the browser's `localStorage`.
2. **Server ledger** — An in-memory Map tracks balances, stakes, and transaction history per address. This is a demo backend — swap `wallet-store.ts` for a real database in production.
3. **Anti-bot flow** — Before sensitive actions (send), the client fetches a proof-of-work challenge from `/api/challenge`, solves it in-browser, and submits the solution alongside honeypot and timing data.
4. **Staking** — Users lock tokens at 2% APR. Rewards accrue daily and are settled on stake/unstake/claim actions.
5. **Deposits** — Users select a currency (USDT/BTC/SOL), see the deposit address and amount, mark the payment as sent, and tokens are credited after a confirmation delay.

---

## Security Notes

- **Private keys stay client-side.** The server never receives or stores private keys.
- **localStorage is not production-grade key storage.** In production, encrypt the keystore with a user passphrase or integrate a hardware/injected wallet.
- **The in-memory ledger resets on server restart.** Replace `wallet-store.ts` with a persistent database (PostgreSQL, MongoDB, etc.) for production use.
- **`BOT_GUARD_SECRET`** must be set to a strong random value in production (e.g., `openssl rand -hex 32`).

---

## Rebranding

To fully rebrand the app, set these env vars:

```bash
NEXT_PUBLIC_APP_NAME=Nova
NEXT_PUBLIC_APP_TOKEN_SYMBOL=NOVA
NEXT_PUBLIC_APP_TAGLINE=Smart money. Instant rewards.
```

Replace `public/icon.svg` with your own logo. That's it — the entire UI updates automatically.

---

## License

MIT
