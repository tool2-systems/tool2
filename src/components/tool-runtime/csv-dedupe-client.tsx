"use client";

import { useState } from "react";
import { ToolPreview } from "@/components/tool-runtime/tool-preview";

export function CsvDedupeClient() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const [preview, setPreview] = useState<string | null>(null);

  async function handleRun() {
    if (!file) return;

    setStatus("processing");
    setPreview(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/csv-dedupe", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      setStatus("error");
      return;
    }

    const blob = await res.blob();
    const text = await blob.text();

    const lines = text.split(/\r?\n/).slice(0, 5).join("\n");
    setPreview(lines);
    setStatus("done");
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept=".csv,.txt"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      <button
        onClick={handleRun}
        disabled={!file}
        className="px-4 py-2 border rounded"
      >
        Run (client)
      </button>

      <div className="text-sm text-muted-foreground">
        {status === "idle" && "Waiting for input…"}
        {status === "processing" && "Processing…"}
        {status === "done" && "Preview ready."}
        {status === "error" && "Error while processing."}
      </div>

      {preview && <ToolPreview locked={false} previewText={preview} />}
    </div>
  );
}
