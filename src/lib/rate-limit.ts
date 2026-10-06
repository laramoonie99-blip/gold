import { RateLimiterMemory } from "rate-limiter-flexible";
import type { NextRequest } from "next/server";

// Global in-memory limiters — swap for Redis-backed in production
const globalLimiter = new RateLimiterMemory({
  points: 60, // 60 reqs
  duration: 60, // per minute
});

const sensitiveLimiter = new RateLimiterMemory({
  points: 10, // 10 reqs
  duration: 60, // per minute
  blockDuration: 60,
});

const burstLimiter = new RateLimiterMemory({
  points: 5,
  duration: 10, // 5 req per 10s burst
});

export type LimitKind = "global" | "sensitive" | "burst";

export function clientKey(req: NextRequest | Request): string {
  const h = (req as NextRequest).headers;
  const fwd = h.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0]?.trim() || h.get("x-real-ip") || "anon";
  return ip;
}

export async function enforceRateLimit(
  req: NextRequest | Request,
  kind: LimitKind = "global"
): Promise<{ ok: true } | { ok: false; retryAfterMs: number }> {
  const key = clientKey(req);
  const limiter =
    kind === "sensitive" ? sensitiveLimiter : kind === "burst" ? burstLimiter : globalLimiter;
  try {
    await limiter.consume(key);
    return { ok: true };
  } catch (rejRes: any) {
    return { ok: false, retryAfterMs: rejRes?.msBeforeNext ?? 60_000 };
  }
}
