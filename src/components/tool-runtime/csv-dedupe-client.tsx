"use client";

import { useState } from "react";
import { ToolPreview } from "@/components/tool-runtime/tool-preview";
import { ToolUnlock } from "@/components/tool-runtime/tool-unlock";

export function CsvDedupeClient() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<
    "idle" | "checking" | "ready" | "error"
  >("idle");

  async function handleRun() {
    if (!file) return;

    setStatus("processing");
    setPreview(null);
    setResultId(null);
    setToken(null);
    setDownloadStatus("idle");

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

    const data = await res.json().catch(() => null);

    const previewText = data?.preview as string | undefined;
    const newResultId = data?.resultId as string | undefined;

    if (!previewText || !newResultId) {
      setStatus("error");
      return;
    }

    setPreview(previewText);
    setResultId(newResultId);
    setStatus("done");
  }

  async function handleDownload() {
    if (!token) return;

    setDownloadStatus("checking");

    const res = await fetch(`/api/download?token=${encodeURIComponent(token)}`);

    if (!res.ok) {
      setDownloadStatus("error");
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "result.csv";
    a.click();
    URL.revokeObjectURL(url);

    setDownloadStatus("ready");
  }

  async function handleUnlock(tokenValue: string) {
    setToken(tokenValue);
    setDownloadStatus("idle");

    if (!resultId) {
      return;
    }

    await fetch("/api/register-download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: tokenValue,
        resultId,
      }),
    }).catch(() => {});
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

      <ToolUnlock
        enabled={!!preview}
        toolSlug="csv-dedupe"
        resultId={resultId}
        onUnlock={handleUnlock}
      />

      {token && (
        <div className="space-y-2">
          <button onClick={handleDownload} className="px-4 py-2 border rounded">
            Download full file
          </button>
          <p className="text-xs text-muted-foreground">
            {downloadStatus === "idle" && "Download is available."}
            {downloadStatus === "checking" && "Downloading…"}
            {downloadStatus === "ready" && "File downloaded."}
            {downloadStatus === "error" && "Download failed."}
          </p>
        </div>
      )}
    </div>
  );
}
