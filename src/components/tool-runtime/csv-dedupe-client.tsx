"use client";

import { useState } from "react";
import { ToolPreview } from "@/components/tool-runtime/tool-preview";
import { ToolUnlock } from "@/components/tool-runtime/tool-unlock";

export function CsvDedupeClient() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<
    "idle" | "checking" | "ready" | "error"
  >("idle");

  async function handleRun() {
    if (!file) return;

    setStatus("processing");
    setPreview(null);
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

    const blob = await res.blob();
    const text = await blob.text();

    const lines = text.split(/\r?\n/).slice(0, 5).join("\n");
    setPreview(lines);
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

    setDownloadStatus("ready");
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
        onUnlock={(t) => {
          setToken(t);
          setDownloadStatus("idle");
        }}
      />

      {token && (
        <div className="space-y-2">
          <button
            onClick={handleDownload}
            className="px-4 py-2 border rounded"
          >
            Download full file (stub)
          </button>
          <p className="text-xs text-muted-foreground">
            {downloadStatus === "idle" && "Download is available. This is a stub."}
            {downloadStatus === "checking" && "Checking download…"}
            {downloadStatus === "ready" &&
              "Token validated. File download will be wired here later."}
            {downloadStatus === "error" &&
              "Download failed. Token was rejected by the server."}
          </p>
        </div>
      )}
    </div>
  );
}
