"use client";

const BASE_URL = "/api";
const TIMEOUT = 15_000;

async function request<T>(
  method: "GET" | "POST",
  path: string,
  opts?: { params?: Record<string, string>; body?: unknown }
): Promise<T> {
  let url = `${BASE_URL}${path}`;

  if (opts?.params) {
    const qs = new URLSearchParams(opts.params).toString();
    if (qs) url += `?${qs}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const res = await fetch(url, {
      method,
      headers: method === "POST" ? { "Content-Type": "application/json" } : undefined,
      body: opts?.body ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.error || `Request failed (${res.status})`);
    }

    return data as T;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  get<T>(path: string, opts?: { params?: Record<string, string> }) {
    return request<T>("GET", path, opts).then((data) => ({ data }));
  },
  post<T>(path: string, body?: unknown) {
    return request<T>("POST", path, body ? { body } : undefined).then((data) => ({ data }));
  },
};

export type Challenge = {
  nonce: string;
  issuedAt: number;
  difficulty: number;
  sig: string;
};

export async function fetchChallenge(): Promise<Challenge> {
  const { data } = await api.get<Challenge>("/challenge");
  return data;
}

export async function solveChallenge(ch: Challenge): Promise<string> {
  const target = "0".repeat(ch.difficulty);
  const enc = new TextEncoder();
  let i = 0;
  while (true) {
    const candidate = i.toString(36);
    const buf = await crypto.subtle.digest(
      "SHA-256",
      enc.encode(`${ch.nonce}:${candidate}`)
    );
    const hex = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    if (hex.startsWith(target)) return candidate;
    i++;
    if (i > 500_000) throw new Error("Challenge too hard (unexpected).");
  }
}
