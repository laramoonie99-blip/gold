// Public app config. Override at build/runtime with env vars.
// NEXT_PUBLIC_* vars are exposed to the browser bundle.

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Scorp";
export const APP_TAGLINE =
  process.env.NEXT_PUBLIC_APP_TAGLINE ||
  "2% APR on every stake";
export const APP_TOKEN_SYMBOL =
  process.env.NEXT_PUBLIC_APP_TOKEN_SYMBOL || "SCORP";

export const APP_FULL_NAME = `${APP_NAME} Wallet`;

// Conversion rates: how many tokens 1 unit of each currency buys.
export const DEPOSIT_RATE_USDT = Number(
  process.env.NEXT_PUBLIC_DEPOSIT_RATE_USDT || "10"
);
export const DEPOSIT_RATE_BTC = Number(
  process.env.NEXT_PUBLIC_DEPOSIT_RATE_BTC || "600000"
);
export const DEPOSIT_RATE_SOL = Number(
  process.env.NEXT_PUBLIC_DEPOSIT_RATE_SOL || "1500"
);

export const DEPOSIT_ADDRESS_USDT =
  process.env.NEXT_PUBLIC_DEPOSIT_ADDRESS_USDT ||
  "0x0000000000000000000000000000000000000000";
export const DEPOSIT_ADDRESS_BTC =
  process.env.NEXT_PUBLIC_DEPOSIT_ADDRESS_BTC ||
  "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
export const DEPOSIT_ADDRESS_SOL =
  process.env.NEXT_PUBLIC_DEPOSIT_ADDRESS_SOL ||
  "11111111111111111111111111111111";
