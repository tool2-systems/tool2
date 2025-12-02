"use client";

import { useState } from "react";

export function CsvDedupeClient() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  async function handleRun() {
    if (!file) return;

    setStatus("processing");
    setResultBlob(null);

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
    setResultBlob(blob);
    setStatus("done");
  }

  function handleDownload() {
    if (!resultBlob) return;

    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "result.csv";
    a.click();
    URL.revokeObjectURL(url);
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
        {status === "done" && "Processing completed."}
        {status === "error" && "Error while processing."}
      </div>

      {status === "done" && resultBlob && (
        <button
          onClick={handleDownload}
          className="px-4 py-2 border rounded"
        >
          Download result
        </button>
      )}
    </div>
  );
}
