import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { checkinStatus, claimDailyCheckin } from "@/lib/wallet-store";

export const runtime = "nodejs";

function parseAddress(raw: string | null): string | null {
  if (!raw) return null;
  return /^0x[a-fA-F0-9]{40}$/.test(raw) ? raw : null;
}

export async function GET(req: NextRequest) {
  const rl = await enforceRateLimit(req, "global");
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  const address = parseAddress(req.nextUrl.searchParams.get("address"));
  if (!address) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }
  return NextResponse.json(checkinStatus(address));
}

export async function POST(req: NextRequest) {
  const burst = await enforceRateLimit(req, "burst");
  if (!burst.ok) {
    return NextResponse.json(
      { error: "You're going too fast. Please wait a moment." },
      { status: 429 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const address = parseAddress(String(body?.address || ""));
  if (!address) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  const result = claimDailyCheckin(address);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, nextEligibleAt: result.nextEligibleAt },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    wallet: result.wallet,
    reward: result.reward,
    streak: result.streak,
    tx: result.tx,
  });
}
