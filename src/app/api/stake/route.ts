import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  claimStakeRewards,
  stake,
  stakeStatus,
  unstake,
} from "@/lib/wallet-store";

export const runtime = "nodejs";

function parseAddress(raw: string | null | undefined): string | null {
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
  return NextResponse.json(stakeStatus(address));
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
  const action = String(body?.action || "");
  const amount = Number(body?.amount);

  if (action === "stake") {
    const r = stake(address, amount);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true, wallet: r.wallet, settled: r.settled });
  }
  if (action === "unstake") {
    const r = unstake(address, amount);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true, wallet: r.wallet, settled: r.settled });
  }
  if (action === "claim") {
    const r = claimStakeRewards(address);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true, wallet: r.wallet, reward: r.reward });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
