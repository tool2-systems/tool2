"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type ToolUnlockProps = {
  priceLabel?: string;
};

export function ToolUnlock({ priceLabel = "Unlock full download — $2" }: ToolUnlockProps) {
  const [status, setStatus] = useState<"idle" | "pending">("idle");

  function handleClick() {
    if (status === "pending") return;
    setStatus("pending");

    setTimeout(() => {
      setStatus("idle");
    }, 800);
  }

  return (
    <div className="space-y-2">
      <Button
        className="w-full"
        disabled={status === "pending"}
        onClick={handleClick}
      >
        {priceLabel}
      </Button>
      <p className="text-xs text-muted-foreground">
        Payments are not implemented yet.
      </p>
    </div>
  );
}
