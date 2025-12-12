"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type ToolUnlockProps = {
  priceLabel?: string;
  enabled?: boolean;
  toolSlug?: string;
  resultId?: string | null;
  onUnlock?: (token: string) => void;
};

export function ToolUnlock({
  priceLabel = "Unlock full download — $2",
  enabled = false,
  toolSlug,
  resultId,
  onUnlock,
}: ToolUnlockProps) {
  const [status, setStatus] = useState<
    "idle" | "starting" | "waiting" | "success" | "error"
  >("idle");

  const [checkoutId, setCheckoutId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const pollIdRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
      pollIdRef.current += 1;
    };
  }, []);

  const disabled =
    status === "starting" ||
    status === "waiting" ||
    !enabled ||
    !toolSlug ||
    !resultId;

  async function startCheckout() {
    if (disabled) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    pollIdRef.current += 1;

    setCheckoutId(null);
    setStatus("starting");

    const res = await fetch("/api/payments/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolSlug, resultId }),
      signal: abortRef.current.signal,
    }).catch(() => null);

    if (!res || !res.ok) {
      setStatus("error");
      return;
    }

    const data = await res.json().catch(() => null);
    const id = data?.checkoutId as string | undefined;

    if (!id) {
      setStatus("error");
      return;
    }

    setCheckoutId(id);
    setStatus("waiting");

    const myPollId = pollIdRef.current;
    pollForToken(id, myPollId);
  }

  async function pollForToken(id: string, pollId: number) {
    const controller = abortRef.current;
    if (!controller) return;

    for (let i = 0; i < 60; i += 1) {
      if (controller.signal.aborted) return;
      if (pollIdRef.current !== pollId) return;

      const res = await fetch(
        `/api/webhooks/lemon?checkoutId=${encodeURIComponent(id)}`,
        { signal: controller.signal, cache: "no-store" }
      ).catch(() => null);

      if (controller.signal.aborted) return;
      if (pollIdRef.current !== pollId) return;

      if (res && res.ok) {
        const data = await res.json().catch(() => null);

        if (data?.status === "paid" && typeof data?.token === "string") {
          setStatus("success");
          if (onUnlock) onUnlock(data.token);
          return;
        }
      }

      await new Promise((r) => setTimeout(r, 1000));
    }

    if (pollIdRef.current === pollId) {
      setStatus("error");
    }
  }

  let helper = "";
  if (!enabled) helper = "Run the tool to unlock payment.";
  else if (!toolSlug || !resultId) helper = "Processing state is incomplete.";
  else if (status === "waiting") helper = "Waiting for payment confirmation…";
  else if (status === "success") helper = "Payment confirmed.";
  else if (status === "error") helper = "Payment failed.";
  else helper = "Payments are not integrated yet.";

  const label =
    status === "starting"
      ? "Starting checkout…"
      : status === "waiting"
      ? "Waiting for payment…"
      : priceLabel;

  return (
    <div className="space-y-2">
      <Button className="w-full" disabled={disabled} onClick={startCheckout}>
        {label}
      </Button>
      <p className="text-xs text-muted-foreground">{helper}</p>
      {checkoutId && (
        <p className="text-xs text-muted-foreground">Checkout ID: {checkoutId}</p>
      )}
    </div>
  );
}
