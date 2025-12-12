"use client";

import { useState } from "react";
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

  const disabled =
    status === "starting" ||
    status === "waiting" ||
    !enabled ||
    !toolSlug ||
    !resultId;

  async function startCheckout() {
    if (disabled) return;

    setStatus("starting");

    const res = await fetch("/api/payments/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolSlug, resultId }),
    });

    if (!res.ok) {
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

    pollForToken(id);
  }

  async function pollForToken(id: string) {
    for (let i = 0; i < 30; i += 1) {
      const res = await fetch(`/api/webhooks/lemon?checkoutId=${encodeURIComponent(id)}`);
      const data = await res.json().catch(() => null);

      if (data?.status === "paid" && typeof data?.token === "string") {
        setStatus("success");
        if (onUnlock) onUnlock(data.token);
        return;
      }

      await new Promise((r) => setTimeout(r, 500));
    }

    setStatus("error");
  }

  let helper = "";
  if (!enabled) helper = "Run the tool to unlock payment.";
  else if (!toolSlug || !resultId) helper = "Processing state is incomplete.";
  else if (status === "waiting") helper = "Waiting for payment confirmation…";
  else if (status === "success") helper = "Payment confirmed.";
  else if (status === "error") helper = "Payment failed.";
  else helper = "Payments are not integrated yet.";

  const label =
    status === "starting" ? "Starting checkout…" :
    status === "waiting" ? "Waiting for payment…" :
    priceLabel;

  return (
    <div className="space-y-2">
      <Button className="w-full" disabled={disabled} onClick={startCheckout}>
        {label}
      </Button>
      <p className="text-xs text-muted-foreground">{helper}</p>
      {checkoutId && (
        <p className="text-xs text-muted-foreground">
          Checkout ID: {checkoutId}
        </p>
      )}
    </div>
  );
}
