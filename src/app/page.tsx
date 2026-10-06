"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Onboarding } from "@/components/wallet/onboarding";
import { Dashboard } from "@/components/wallet/dashboard";
import { loadWallet, type LocalWallet } from "@/lib/wallet-client";

export default function Home() {
  const [wallet, setWallet] = useState<LocalWallet | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setWallet(loadWallet());
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return wallet ? (
    <Dashboard wallet={wallet} onSignOut={() => setWallet(null)} />
  ) : (
    <Onboarding onReady={setWallet} />
  );
}
