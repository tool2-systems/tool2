"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createDemoToken } from "@/lib/token";

type ToolUnlockProps = {
  priceLabel?: string;
  enabled?: boolean;
  onUnlock?: (token: string) => void;
};

export function ToolUnlock({
  priceLabel = "Unlock full download — $2",
  enabled = false,
  onUnlock,
}: ToolUnlockProps) {
  const [status, setStatus] = useState<"idle" | "pending" | "success">("idle");

  const disabled = status === "pending" || !enabled;

  function handleClick() {
    if (disabled) return;

    setStatus("pending");

    setTimeout(() => {
      const token = createDemoToken();
      setStatus("success");
      if (onUnlock) {
        onUnlock(token);
      }
    }, 800);
  }

  const buttonLabel =
    status === "pending" ? "Processing…" : priceLabel;

  let helper = "";
  if (!enabled) {
    helper = "Run the tool to unlock payment.";
  } else if (status === "success") {
    helper = "Payment confirmed. Download will be enabled once wired.";
  } else {
    helper = "Payments are not integrated yet.";
  }

  return (
    <div className="space-y-2">
      <Button
        className="w-full"
        disabled={disabled}
        onClick={handleClick}
      >
        {buttonLabel}
      </Button>
      <p className="text-xs text-muted-foreground">
        {helper}
      </p>
    </div>
  );
}
