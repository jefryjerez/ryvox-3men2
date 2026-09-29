"use client";

import { useEffect, useRef, useState } from "react";
import { BellRing } from "lucide-react";
import { playOrderChime } from "@/lib/notification-sound";
import { useT } from "@/i18n/client";

type Status = "checking" | "unsupported" | "denied" | "off" | "on";

function urlBase64ToUint8Array(base64url: string): Uint8Array {
  const pad = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function PushBell() {
  const { t } = useT();
  const p = t.dash.push;
  const [status, setStatus] = useState<Status>(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
    if (Notification.permission === "denied") return "denied";
    return "checking";
  });
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== "checking") return;
    (async () => {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/dashboard/" });
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? "on" : "off");
    })().catch(() => setStatus("off"));
  }, [status]);

  // El sonido propio solo se puede reproducir con la pestaña abierta: lo dispara el service worker por mensaje.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "ryvox-push") playOrderChime();
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function enable() {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus(perm === "denied" ? "denied" : "off");
        return;
      }
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) throw new Error("no vapid key");
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/dashboard/" });
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) as unknown as BufferSource });
      const json = sub.toJSON();
      const res = await fetch("/api/admin/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      if (!res.ok) throw new Error("subscribe failed");
      setStatus("on");
    } catch {
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/dashboard/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/admin/push/unsubscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setTestSent(false);
    await fetch("/api/admin/push/test", { method: "POST" }).catch(() => null);
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2500);
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        aria-label={p.title}
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5"
      >
        <BellRing size={19} strokeWidth={1.75} />
        {status === "on" && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-black" />}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-30 w-72 rounded-2xl border border-line bg-white p-4 shadow-lg">
          <p className="text-sm font-semibold">{p.title}</p>
          <p className="mt-1 text-xs text-black/55">{p.hint}</p>
          <div className="mt-3">
            {status === "unsupported" && <p className="text-xs text-black/50">{p.unsupported}</p>}
            {status === "denied" && <p className="text-xs text-alert">{p.denied}</p>}
            {status === "checking" && <p className="text-xs text-black/40">…</p>}
            {status === "off" && (
              <button type="button" onClick={enable} disabled={busy} className="w-full rounded-xl bg-black px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                {busy ? p.enabling : p.enable}
              </button>
            )}
            {status === "on" && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-black">✓ {p.enabled}</p>
                <button type="button" onClick={sendTest} className="w-full rounded-xl border border-line px-3 py-2 text-xs font-medium hover:bg-black/5">
                  {testSent ? p.testSent : p.test}
                </button>
                <button type="button" onClick={disable} disabled={busy} className="w-full rounded-xl border border-line px-3 py-2 text-xs font-medium text-black/60 hover:bg-black/5 disabled:opacity-50">
                  {busy ? p.disabling : p.disable}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
