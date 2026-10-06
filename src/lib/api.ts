"use client";
import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// Simple response-side normalizer so UI gets consistent error messages.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err?.response?.data?.error ||
      err?.message ||
      "Network error. Please check your connection.";
    return Promise.reject(new Error(msg));
  }
);

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
  // Lightweight PoW: find a nonce whose sha256(nonce:solution) begins with N zeros.
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
