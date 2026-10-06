import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { verifyBotCheck } from "@/lib/bot-guard";
import { sendTransaction } from "@/lib/wallet-store";

export const runtime = "nodejs";

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
      { error: "Transaction rate limit reached. Try again shortly." },
      { status: 429 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const bot = verifyBotCheck({
    honeypot: body?.hp,
    renderedAt: body?.renderedAt,
    challenge: body?.challenge,
    userAgent: req.headers.get("user-agent") || "",
  });
  if (!bot.ok) {
    return NextResponse.json({ error: `Bot check failed: ${bot.reason}` }, { status: 403 });
  }

  const from = String(body?.from || "");
  const to = String(body?.to || "");
  const amount = Number(body?.amount);
  const note = body?.note ? String(body.note).slice(0, 140) : undefined;

  if (!/^0x[a-fA-F0-9]{40}$/.test(from) || !/^0x[a-fA-F0-9]{40}$/.test(to)) {
    return NextResponse.json({ error: "Invalid address format" }, { status: 400 });
  }

  const result = sendTransaction({ from, to, amount, note });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    wallet: result.wallet,
    tx: result.tx,
  });
}
