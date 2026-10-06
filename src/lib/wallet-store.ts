// In-memory wallet store (demo). Replace with a real database in production.
// Stores: address → { balance, staked, rewards, txs }. No private keys are ever stored server-side.

export type TxRecord = {
  id: string;
  type:
    | "send"
    | "receive"
    | "deposit"
    | "checkin"
    | "stake"
    | "unstake"
    | "stake-reward";
  from?: string;
  to?: string;
  amount: number;
  at: number;
  note?: string;
};

export type WalletState = {
  address: string;
  balance: number;
  cashback: number;
  staked: number;
  stakeStartedAt: number | null;
  txs: TxRecord[];
  checkinStreak: number;
  lastCheckinAt: number | null;
  pendingDeposits: PendingDeposit[];
};

const WELCOME_BALANCE = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const YEAR_MS = 365 * DAY_MS;
const STREAK_WINDOW_MS = 48 * 60 * 60 * 1000;
const CHECKIN_REWARDS = [5, 8, 12, 18, 25, 35, 60];
export const STAKE_APR = 0.02;

import {
  DEPOSIT_RATE_USDT,
  DEPOSIT_RATE_BTC,
  DEPOSIT_RATE_SOL,
} from "@/lib/config";

export const DEPOSIT_RATES: Record<string, number> = {
  USDT: DEPOSIT_RATE_USDT,
  BTC: DEPOSIT_RATE_BTC,
  SOL: DEPOSIT_RATE_SOL,
};
export type DepositCurrency = keyof typeof DEPOSIT_RATES;

export type PendingDeposit = {
  id: string;
  currency: DepositCurrency;
  paid: number;
  credited: number;
  depositAddress: string;
  status: "awaiting_payment" | "confirming" | "confirmed";
  createdAt: number;
  sentAt: number | null;
  confirmedAt: number | null;
};

const CONFIRM_DELAY_MS = 60_000;

import {
  DEPOSIT_ADDRESS_USDT,
  DEPOSIT_ADDRESS_BTC,
  DEPOSIT_ADDRESS_SOL,
} from "@/lib/config";

export const DEPOSIT_ADDRESSES: Record<DepositCurrency, string> = {
  USDT: DEPOSIT_ADDRESS_USDT,
  BTC: DEPOSIT_ADDRESS_BTC,
  SOL: DEPOSIT_ADDRESS_SOL,
};

const store = new Map<string, WalletState>();

function ensure(address: string): WalletState {
  const key = address.toLowerCase();
  let w = store.get(key);
  if (!w) {
    w = {
      address,
      balance: WELCOME_BALANCE,
      cashback: 0,
      staked: 0,
      stakeStartedAt: null,
      txs: [
        {
          id: cryptoId(),
          type: "deposit",
          to: address,
          amount: WELCOME_BALANCE,
          at: Date.now(),
          note: "Welcome bonus",
        },
      ],
      checkinStreak: 0,
      lastCheckinAt: null,
      pendingDeposits: [],
    };
    store.set(key, w);
  }
  if (w.checkinStreak === undefined) w.checkinStreak = 0;
  if (w.lastCheckinAt === undefined) w.lastCheckinAt = null;
  if (w.staked === undefined) w.staked = 0;
  if (w.stakeStartedAt === undefined) w.stakeStartedAt = null;
  if ((w as any).pendingDeposits === undefined) w.pendingDeposits = [];
  return w;
}

function processPendingDeposits(w: WalletState) {
  const now = Date.now();
  for (const dep of w.pendingDeposits) {
    if (
      dep.status === "confirming" &&
      dep.sentAt &&
      now - dep.sentAt >= CONFIRM_DELAY_MS
    ) {
      dep.status = "confirmed";
      dep.confirmedAt = now;
      w.balance = round(w.balance + dep.credited);
      const tx: TxRecord = {
        id: cryptoId(),
        type: "deposit",
        to: w.address,
        amount: dep.credited,
        at: now,
        note: `Bought with ${dep.paid} ${dep.currency}`,
      };
      w.txs = [tx, ...w.txs].slice(0, 100);
    }
  }
  w.pendingDeposits = w.pendingDeposits.filter(
    (d) => d.status !== "confirmed" || now - (d.confirmedAt ?? 0) < 5 * 60 * 1000
  );
}

export function getWallet(address: string): WalletState {
  const w = ensure(address);
  processPendingDeposits(w);
  return w;
}

const DAILY_RATE = STAKE_APR / 365;

export function pendingStakeReward(
  staked: number,
  startedAt: number | null,
  now = Date.now()
): number {
  if (!startedAt || staked <= 0) return 0;
  const days = Math.floor((now - startedAt) / DAY_MS);
  if (days <= 0) return 0;
  return round(staked * DAILY_RATE * days);
}

export function dailyReward(staked: number): number {
  if (staked <= 0) return 0;
  return round(staked * DAILY_RATE);
}

export function nextRewardAt(
  staked: number,
  startedAt: number | null,
  now = Date.now()
): number | null {
  if (!startedAt || staked <= 0) return null;
  const daysElapsed = Math.floor((now - startedAt) / DAY_MS);
  return startedAt + (daysElapsed + 1) * DAY_MS;
}

export function sendTransaction(opts: {
  from: string;
  to: string;
  amount: number;
  note?: string;
}): { ok: true; wallet: WalletState; tx: TxRecord } | { ok: false; error: string } {
  const { from, to, amount, note } = opts;
  if (!from || !to) return { ok: false, error: "Missing from/to." };
  if (from.toLowerCase() === to.toLowerCase()) return { ok: false, error: "Cannot send to yourself." };
  if (!(amount > 0) || !isFinite(amount)) return { ok: false, error: "Amount must be positive." };

  const sender = ensure(from);
  if (sender.balance < amount) return { ok: false, error: "Insufficient balance." };

  const recipient = ensure(to);

  sender.balance = round(sender.balance - amount);
  recipient.balance = round(recipient.balance + amount);

  const now = Date.now();
  const tx: TxRecord = { id: cryptoId(), type: "send", from, to, amount, at: now, note };
  const recvTx: TxRecord = { id: cryptoId(), type: "receive", from, to, amount, at: now, note };

  sender.txs = [tx, ...sender.txs].slice(0, 100);
  recipient.txs = [recvTx, ...recipient.txs].slice(0, 100);

  return { ok: true, wallet: sender, tx };
}

export function rewardForStreak(streak: number): number {
  if (streak < 1) return CHECKIN_REWARDS[0];
  const idx = (streak - 1) % CHECKIN_REWARDS.length;
  return CHECKIN_REWARDS[idx];
}

export function checkinStatus(address: string) {
  const w = ensure(address);
  const now = Date.now();
  const last = w.lastCheckinAt ?? 0;
  const sinceLast = now - last;
  const continuing = last !== 0 && sinceLast < STREAK_WINDOW_MS;
  const nextStreak = continuing ? w.checkinStreak + 1 : 1;
  const canClaim = last === 0 || sinceLast >= DAY_MS;
  const nextEligibleAt = last === 0 ? now : last + DAY_MS;
  return {
    canClaim,
    streak: w.checkinStreak,
    nextStreak,
    nextReward: rewardForStreak(nextStreak),
    lastCheckinAt: w.lastCheckinAt,
    nextEligibleAt,
  };
}

export function claimDailyCheckin(
  address: string
):
  | { ok: true; wallet: WalletState; reward: number; streak: number; tx: TxRecord }
  | { ok: false; error: string; nextEligibleAt?: number } {
  const w = ensure(address);
  const now = Date.now();
  const last = w.lastCheckinAt ?? 0;
  const sinceLast = now - last;
  if (last !== 0 && sinceLast < DAY_MS) {
    return {
      ok: false,
      error: "You've already claimed today. Come back tomorrow!",
      nextEligibleAt: last + DAY_MS,
    };
  }
  const continuing = last !== 0 && sinceLast < STREAK_WINDOW_MS;
  const newStreak = continuing ? w.checkinStreak + 1 : 1;
  const reward = rewardForStreak(newStreak);
  w.checkinStreak = newStreak;
  w.lastCheckinAt = now;
  w.balance = round(w.balance + reward);
  w.cashback = round(w.cashback + reward);
  const tx: TxRecord = {
    id: cryptoId(),
    type: "checkin",
    to: address,
    amount: reward,
    at: now,
    note: `Day ${newStreak} check-in`,
  };
  w.txs = [tx, ...w.txs].slice(0, 100);
  return { ok: true, wallet: w, reward, streak: newStreak, tx };
}

function settlePending(w: WalletState): number {
  const now = Date.now();
  if (!w.stakeStartedAt || w.staked <= 0) {
    if (w.staked <= 0) w.stakeStartedAt = null;
    return 0;
  }
  const days = Math.floor((now - w.stakeStartedAt) / DAY_MS);
  if (days <= 0) return 0;
  const reward = round(w.staked * DAILY_RATE * days);
  w.balance = round(w.balance + reward);
  w.cashback = round(w.cashback + reward);
  const tx: TxRecord = {
    id: cryptoId(),
    type: "stake-reward",
    to: w.address,
    amount: reward,
    at: now,
    note: `Staking reward · ${days}d`,
  };
  w.txs = [tx, ...w.txs].slice(0, 100);
  w.stakeStartedAt = w.stakeStartedAt + days * DAY_MS;
  return reward;
}

export function stakeStatus(address: string) {
  const w = ensure(address);
  const now = Date.now();
  return {
    balance: w.balance,
    staked: w.staked,
    stakeStartedAt: w.stakeStartedAt,
    apr: STAKE_APR,
    pending: pendingStakeReward(w.staked, w.stakeStartedAt, now),
    dailyReward: dailyReward(w.staked),
    nextRewardAt: nextRewardAt(w.staked, w.stakeStartedAt, now),
  };
}

export function stake(
  address: string,
  amount: number
):
  | { ok: true; wallet: WalletState; settled: number; tx: TxRecord }
  | { ok: false; error: string } {
  if (!(amount > 0) || !isFinite(amount))
    return { ok: false, error: "Amount must be positive." };
  const w = ensure(address);
  if (w.balance < amount)
    return { ok: false, error: "Not enough balance to stake that amount." };

  const settled = settlePending(w);
  const now = Date.now();
  w.balance = round(w.balance - amount);
  w.staked = round(w.staked + amount);
  if (!w.stakeStartedAt) w.stakeStartedAt = now;

  const tx: TxRecord = {
    id: cryptoId(),
    type: "stake",
    to: address,
    amount,
    at: now,
    note: "Staked",
  };
  w.txs = [tx, ...w.txs].slice(0, 100);
  return { ok: true, wallet: w, settled, tx };
}

export function unstake(
  address: string,
  amount: number
):
  | { ok: true; wallet: WalletState; settled: number; tx: TxRecord }
  | { ok: false; error: string } {
  if (!(amount > 0) || !isFinite(amount))
    return { ok: false, error: "Amount must be positive." };
  const w = ensure(address);
  if (w.staked < amount)
    return { ok: false, error: "You don't have that much staked." };

  const settled = settlePending(w);
  const now = Date.now();
  w.staked = round(w.staked - amount);
  w.balance = round(w.balance + amount);
  if (w.staked <= 0) w.stakeStartedAt = null;

  const tx: TxRecord = {
    id: cryptoId(),
    type: "unstake",
    to: address,
    amount,
    at: now,
    note: "Unstaked",
  };
  w.txs = [tx, ...w.txs].slice(0, 100);
  return { ok: true, wallet: w, settled, tx };
}

export function claimStakeRewards(
  address: string
):
  | { ok: true; wallet: WalletState; reward: number }
  | { ok: false; error: string } {
  const w = ensure(address);
  const pending = pendingStakeReward(w.staked, w.stakeStartedAt);
  if (pending <= 0) {
    return { ok: false, error: "No rewards to claim yet." };
  }
  settlePending(w);
  return { ok: true, wallet: w, reward: pending };
}

export function initiateDeposit(
  address: string,
  currency: DepositCurrency,
  amount: number
): { ok: true; deposit: PendingDeposit } | { ok: false; error: string } {
  if (!(amount > 0) || !isFinite(amount))
    return { ok: false, error: "Amount must be positive." };
  const rate = DEPOSIT_RATES[currency];
  if (!rate) return { ok: false, error: "Unsupported currency." };

  const w = ensure(address);
  const deposit: PendingDeposit = {
    id: cryptoId(),
    currency,
    paid: amount,
    credited: round(amount * rate),
    depositAddress: DEPOSIT_ADDRESSES[currency],
    status: "awaiting_payment",
    createdAt: Date.now(),
    sentAt: null,
    confirmedAt: null,
  };
  w.pendingDeposits.push(deposit);
  return { ok: true, deposit };
}

export function markDepositSent(
  address: string,
  depositId: string
): { ok: true; deposit: PendingDeposit } | { ok: false; error: string } {
  const w = ensure(address);
  const dep = w.pendingDeposits.find((d) => d.id === depositId);
  if (!dep) return { ok: false, error: "Deposit not found." };
  if (dep.status !== "awaiting_payment")
    return { ok: false, error: "Deposit already sent or confirmed." };
  dep.status = "confirming";
  dep.sentAt = Date.now();
  return { ok: true, deposit: dep };
}

export function getPendingDeposits(address: string): PendingDeposit[] {
  const w = ensure(address);
  processPendingDeposits(w);
  return w.pendingDeposits;
}

function round(n: number) {
  return Math.round(n * 1e6) / 1e6;
}

function cryptoId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const CONSTANTS = {
  WELCOME_BALANCE,
  CHECKIN_REWARDS,
  DAY_MS,
  STREAK_WINDOW_MS,
  STAKE_APR,
};
