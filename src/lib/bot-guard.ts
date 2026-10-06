import crypto from "node:crypto";

// Lightweight stateless bot prevention:
// 1. Honeypot field — must be empty.
// 2. Minimum form-fill delay — bots submit instantly.
// 3. Proof-of-work challenge (HMAC-stamped token the client solves briefly).
// 4. UA / headless-browser heuristics.

const SECRET =
  process.env.BOT_GUARD_SECRET ||
  "dev-only-secret-change-me-in-production-xxxxxxxxxxxxxxxxxxxxxxxx";

const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const POW_DIFFICULTY = 4; // leading hex zeros required

function hmac(data: string) {
  return crypto.createHmac("sha256", SECRET).update(data).digest("hex");
}

export function issueChallenge() {
  const nonce = crypto.randomBytes(16).toString("hex");
  const issuedAt = Date.now();
  const sig = hmac(`${nonce}:${issuedAt}`);
  return { nonce, issuedAt, difficulty: POW_DIFFICULTY, sig };
}

export type BotCheckInput = {
  honeypot?: string;
  renderedAt?: number;
  challenge?: { nonce: string; issuedAt: number; sig: string; solution: string };
  userAgent?: string;
};

export function verifyBotCheck(input: BotCheckInput): { ok: true } | { ok: false; reason: string } {
  if (input.honeypot && input.honeypot.length > 0) {
    return { ok: false, reason: "honeypot_tripped" };
  }

  if (!input.renderedAt || Date.now() - input.renderedAt < 1200) {
    return { ok: false, reason: "submitted_too_fast" };
  }

  const ua = (input.userAgent || "").toLowerCase();
  if (!ua || /(headlesschrome|phantomjs|puppeteer|playwright|selenium|slimerjs)/.test(ua)) {
    return { ok: false, reason: "suspicious_user_agent" };
  }

  const c = input.challenge;
  if (!c || !c.nonce || !c.sig || typeof c.issuedAt !== "number" || !c.solution) {
    return { ok: false, reason: "missing_challenge" };
  }
  if (Date.now() - c.issuedAt > CHALLENGE_TTL_MS) {
    return { ok: false, reason: "challenge_expired" };
  }
  const expectedSig = hmac(`${c.nonce}:${c.issuedAt}`);
  if (!timingSafeEqual(expectedSig, c.sig)) {
    return { ok: false, reason: "challenge_tampered" };
  }
  const hash = crypto
    .createHash("sha256")
    .update(`${c.nonce}:${c.solution}`)
    .digest("hex");
  if (!hash.startsWith("0".repeat(POW_DIFFICULTY))) {
    return { ok: false, reason: "invalid_pow" };
  }

  return { ok: true };
}

function timingSafeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
