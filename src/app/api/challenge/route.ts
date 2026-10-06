import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { issueChallenge } from "@/lib/bot-guard";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const rl = await enforceRateLimit(req, "global");
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Slow down." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }
  return NextResponse.json(issueChallenge());
}
