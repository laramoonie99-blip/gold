import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  initiateDeposit,
  markDepositSent,
  getPendingDeposits,
  DEPOSIT_RATES,
  type DepositCurrency,
} from "@/lib/wallet-store";
import { notifyDepositConfirmed } from "@/lib/telegram";

export const runtime = "nodejs";

function parseAddress(raw: unknown): string | null {
  const s = String(raw ?? "");
  return /^0x[a-fA-F0-9]{40}$/.test(s) ? s : null;
}

function parseCurrency(raw: unknown): DepositCurrency | null {
  const s = String(raw ?? "").toUpperCase();
  return s in DEPOSIT_RATES ? (s as DepositCurrency) : null;
}

export async function GET(req: NextRequest) {
  const address = parseAddress(req.nextUrl.searchParams.get("address"));
  const response: Record<string, unknown> = { rates: DEPOSIT_RATES };
  if (address) {
    response.pendingDeposits = getPendingDeposits(address);
  }
  return NextResponse.json(response);
}

export async function POST(req: NextRequest) {
  const burst = await enforceRateLimit(req, "burst");
  if (!burst.ok) {
    return NextResponse.json(
      { error: "You're going too fast. Please wait a moment." },
      { status: 429 }
    );
  }
  const sensitive = await enforceRateLimit(req, "sensitive");
  if (!sensitive.ok) {
    return NextResponse.json(
      { error: "Deposit rate limit reached. Try again shortly." },
      { status: 429 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = String(body?.action ?? "initiate");
  if (action === "confirm-sent") {
    const address = parseAddress(body?.address);
    const depositId = String(body?.depositId ?? "");
    if (!address)
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    if (!depositId)
      return NextResponse.json(
        { error: "Missing deposit ID" },
        { status: 400 }
      );
    const r = markDepositSent(address, depositId);
    if (!r.ok)
      return NextResponse.json({ error: r.error }, { status: 400 });
    notifyDepositConfirmed({
      address,
      currency: String(r.deposit.currency),
      paid: r.deposit.paid,
      credited: r.deposit.credited,
      depositId,
    });
    return NextResponse.json({ ok: true, deposit: r.deposit });
  }

  const address = parseAddress(body?.address);
  const currency = parseCurrency(body?.currency);
  const amount = Number(body?.amount);

  if (!address)
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  if (!currency)
    return NextResponse.json(
      { error: "Unsupported currency" },
      { status: 400 }
    );

  const r = initiateDeposit(address, currency, amount);
  if (!r.ok)
    return NextResponse.json({ error: r.error }, { status: 400 });

  return NextResponse.json({ ok: true, deposit: r.deposit });
}
