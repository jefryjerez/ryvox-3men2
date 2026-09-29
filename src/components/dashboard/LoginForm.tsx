"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/client";

const input = "h-12 w-full rounded-xl border border-line bg-white px-4 text-sm outline-none focus:border-black";
const RESEND_SECONDS = 45;

export function LoginForm() {
  const { t, f, locale } = useT();
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  async function requestCode(e?: FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, lang: locale }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? t.login.genericError);
      setStep("code");
      setCode("");
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code, lang: locale }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? t.login.genericError);
      const next = params.get("next");
      router.replace(next && next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  if (step === "email") {
    return (
      <form onSubmit={requestCode} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-black/60">{t.login.email}</span>
          <input name="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
        </label>
        {error && <p className="text-sm font-medium text-alert">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy || !email}>
          {busy ? t.login.sending : t.login.sendCode}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={verify} className="mt-6 space-y-4">
      <div>
        <h2 className="text-sm font-semibold">{t.login.codeSentTitle}</h2>
        <p className="mt-1 text-sm text-black/55">{f(t.login.codeSentText, { email })}</p>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-black/60">{t.login.code}</span>
        <input
          ref={codeRef}
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className={`${input} text-center text-lg tracking-[0.4em]`}
        />
      </label>
      {error && <p className="text-sm font-medium text-alert">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={busy || code.length !== 6}>
        {busy ? t.login.verifying : t.login.verify}
      </Button>
      <div className="flex items-center justify-between text-xs">
        <button type="button" onClick={() => setStep("email")} className="text-black/50 hover:text-black">
          {t.login.changeEmail}
        </button>
        <button type="button" disabled={cooldown > 0 || busy} onClick={() => requestCode()} className="font-medium text-black disabled:text-black/35">
          {cooldown > 0 ? f(t.login.resendWait, { s: cooldown }) : t.login.resend}
        </button>
      </div>
    </form>
  );
}
