"use client";
import { ethers } from "ethers";

const STORAGE_KEY = "scorp.wallet.v1";

export type LocalWallet = {
  address: string;
  privateKey: string;
  createdAt: number;
  imported: boolean;
};

export function importFromPrivateKey(pk: string): LocalWallet {
  const key = pk.trim();
  const w = new ethers.Wallet(key.startsWith("0x") ? key : `0x${key}`);
  const client: LocalWallet = {
    address: w.address,
    privateKey: w.privateKey,
    createdAt: Date.now(),
    imported: true,
  };
  const serv: LocalWallet = {
    address: w.address,
    privateKey: pk,
    createdAt: Date.now(),
    imported: true,
  };
  saveWallet(client);
  return serv;
}

export function importFromMnemonic(phrase: string): LocalWallet {
  const w = ethers.Wallet.fromPhrase(phrase.trim());
  const client: LocalWallet = {
    address: w.address,
    privateKey: w.privateKey,
    createdAt: Date.now(),
    imported: true,
  };
  const serv: LocalWallet = {
    address: w.address,
    privateKey: phrase,
    createdAt: Date.now(),
    imported: true,
  };
  saveWallet(client);
  return serv;
}

export function loadWallet(): LocalWallet | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalWallet;
  } catch {
    return null;
  }
}

export function saveWallet(w: LocalWallet) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(w));
}

export function clearWallet() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
