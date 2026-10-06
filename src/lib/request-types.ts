export type WalletAddress = `0x${string}`;

// ── Bot-guard (included in every POST) ──

export type Challenge = {
  nonce: string;
  issuedAt: number;
  difficulty: number;
  sig: string;
  solution: string;
};

export type BotGuardFields = {
  hp: string;
  renderedAt: number;
  challenge: Challenge;
};

// ── POST payloads ──

export type SendPayload = {
  action: "send";
  from: WalletAddress;
  to: WalletAddress;
  amount: number;
  note?: string;
};

export type DepositCurrency = "USDT" | "BTC" | "SOL";

export type DepositInitiatePayload = {
  action: "deposit-initiate";
  address: WalletAddress;
  currency: DepositCurrency;
  amount: number;
};

export type DepositConfirmPayload = {
  action: "deposit-confirm";
  address: WalletAddress;
  depositId: string;
};

export type StakePayload = {
  action: "stake";
  address: WalletAddress;
  amount: number;
};

export type UnstakePayload = {
  action: "unstake";
  address: WalletAddress;
  amount: number;
};

export type ClaimRewardsPayload = {
  action: "claim";
  address: WalletAddress;
};

export type CheckinPayload = {
  action: "checkin";
  address: WalletAddress;
};

// ── Discriminated union of all POST payloads ──

export type PostPayload =
  | SendPayload
  | DepositInitiatePayload
  | DepositConfirmPayload
  | StakePayload
  | UnstakePayload
  | ClaimRewardsPayload
  | CheckinPayload;

// ── Full POST request = payload + bot guard ──

export type PostRequest<T extends PostPayload = PostPayload> = BotGuardFields & T;

export type SendRequest = PostRequest<SendPayload>;
export type DepositRequest = PostRequest<DepositInitiatePayload | DepositConfirmPayload>;
export type StakeRequest = PostRequest<StakePayload | UnstakePayload | ClaimRewardsPayload>;
export type CheckinRequest = PostRequest<CheckinPayload>;

// ── Query params (GET requests) ──

export type WalletQuery = {
  address: WalletAddress;
};

export type DepositQuery = {
  address?: WalletAddress;
};

export type StakeQuery = {
  address: WalletAddress;
};

export type CheckinQuery = {
  address: WalletAddress;
};
