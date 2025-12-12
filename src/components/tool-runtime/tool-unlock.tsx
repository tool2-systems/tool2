"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type UnlockStatus = "idle" | "starting" | "waiting" | "success" | "timeout" | "error";

type ToolUnlockProps = {
  enabled: boolean;
  toolSlug: string;
  resultId: string | null;
  onUnlock: (token: string) => void;
};

type CreateCheckoutResponse =
  | { ok: true; checkoutId: string; checkoutUrl: string }
  | { ok: false };

type PollResponse =
  | { ok: true; status: "paid"; token: string }
  | { ok: false; status?: "pending" };

export function ToolUnlock({ enabled, toolSlug, resultId, onUnlock }: ToolUnlockProps) {
  const [status, setStatus] = useState<UnlockStatus>("idle");
  const [checkoutId, setCheckoutId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const unlockedRef = useRef<boolean>(false);

  function stopPolling() {
    if (pollTimerRef.current) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }

  function reset() {
    stopPolling();
    setStatus("idle");
    setCheckoutId(null);
    startedAtRef.current = 0;
    unlockedRef.current = false;
  }

  useEffect(() => {
    if (!enabled) {
      reset();
    }
    return () => {
      stopPolling();
    };
  }, [enabled]);

  async function createCheckout() {
    if (!enabled || !resultId) return null;

    const res = await fetch("/api/payments/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolSlug, resultId }),
    }).catch(() => null);

    if (!res || !res.ok) return null;

    const data = (await res.json().catch(() => null)) as CreateCheckoutResponse | null;
    if (!data || !("ok" in data) || data.ok !== true) return null;

    return data;
  }

  async function pollOnce(id: string) {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const res = await fetch(`/api/webhooks/lemon?checkoutId=${encodeURIComponent(id)}`, {
      method: "GET",
      signal: abortRef.current.signal,
    }).catch(() => null);

    if (!res || !res.ok) {
      return { kind: "error" as const };
    }

    const data = (await res.json().catch(() => null)) as PollResponse | null;
    if (!data) {
      return { kind: "error" as const };
    }

    if ("ok" in data && data.ok === true && data.status === "paid" && typeof data.token === "string") {
      return { kind: "paid" as const, token: data.token };
    }

    return { kind: "pending" as const };
  }

  function scheduleNextPoll(id: string) {
    const elapsed = Date.now() - startedAtRef.current;
    const maxMs = 60000;

    if (elapsed >= maxMs) {
      stopPolling();
      setStatus("timeout");
      return;
    }

    pollTimerRef.current = window.setTimeout(async () => {
      if (unlockedRef.current) return;

      const r = await pollOnce(id);

      if (r.kind === "paid") {
        unlockedRef.current = true;
        stopPolling();
        setStatus("success");
        onUnlock(r.token);
        return;
      }

      if (r.kind === "error") {
        stopPolling();
        setStatus("error");
        return;
      }

      scheduleNextPoll(id);
    }, 2000);
  }

  async function start() {
    if (!enabled) return;
    if (!resultId) return;
    if (status === "starting" || status === "waiting" || status === "success") return;

    setStatus("starting");

    const checkout = await createCheckout();

    if (!checkout) {
      setStatus("error");
      return;
    }

    setCheckoutId(checkout.checkoutId);
    startedAtRef.current = Date.now();
    setStatus("waiting");

    const first = await pollOnce(checkout.checkoutId);

    if (first.kind === "paid") {
      unlockedRef.current = true;
      stopPolling();
      setStatus("success");
      onUnlock(first.token);
      return;
    }

    if (first.kind === "error") {
      stopPolling();
      setStatus("error");
      return;
    }

    scheduleNextPoll(checkout.checkoutId);
  }

  const disabled =
    !enabled || !resultId || status === "starting" || status === "waiting" || status === "success";

  const priceLabel = "Unlock full download — $2";

  let helper = "Payments are not integrated yet.";
  if (!enabled) helper = "Run the tool to generate a preview first.";
  else if (status === "idle") helper = "Unlock is available after preview.";
  else if (status === "starting") helper = "Starting checkout…";
  else if (status === "waiting") helper = "Waiting for payment confirmation…";
  else if (status === "success") helper = "Payment confirmed.";
  else if (status === "timeout") helper = "Payment confirmation timed out.";
  else if (status === "error") helper = "Payment failed.";

  const label =
    status === "starting"
      ? "Starting checkout…"
      : status === "waiting"
      ? "Waiting for payment…"
      : status === "success"
      ? "Unlocked"
      : priceLabel;

  return (
    <div className="space-y-2">
      <Button className="w-full" disabled={disabled} onClick={start}>
        {label}
      </Button>
      <p className="text-xs text-muted-foreground">{helper}</p>
      {checkoutId && (
        <p className="text-xs text-muted-foreground">Checkout ID: {checkoutId}</p>
      )}
    </div>
  );
}
