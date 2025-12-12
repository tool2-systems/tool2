"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToolUnlock } from "@/components/tool-runtime/tool-unlock";

type RunState = "idle" | "processing" | "done" | "error";
type DownloadState = "idle" | "downloading" | "done" | "error";

type FileToolRunnerProps = {
  toolSlug: string;
  label: string;
  accept?: string;
  outputFileName: string;
};

function sampleLines(text: string, maxLines: number) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);
  return lines.slice(0, maxLines).join("\n");
}

export function FileToolRunner({
  toolSlug,
  label,
  accept,
  outputFileName,
}: FileToolRunnerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [runState, setRunState] = useState<RunState>("idle");
  const [message, setMessage] = useState<string>("");
  const [preview, setPreview] = useState<string>("");
  const [resultId, setResultId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [downloadState, setDownloadState] = useState<DownloadState>("idle");

  const canRun = useMemo(() => !!file && runState !== "processing", [file, runState]);
  const previewSample = useMemo(() => sampleLines(preview, 8), [preview]);

  async function onRun() {
    if (!file) return;

    setToken(null);
    setDownloadState("idle");
    setPreview("");
    setResultId(null);

    setRunState("processing");
    setMessage("Processing…");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/${encodeURIComponent(toolSlug)}`, {
      method: "POST",
      body: formData,
    }).catch(() => null);

    if (!res || !res.ok) {
      setRunState("error");
      setMessage("Processing failed.");
      return;
    }

    const data = await res.json().catch(() => null);
    const previewText = (data?.preview as string | undefined) ?? "";
    const id = (data?.resultId as string | undefined) ?? null;

    setPreview(previewText);
    setResultId(id);

    setRunState("done");
    setMessage("Preview ready.");
  }

  function handleUnlock(unlockToken: string) {
    setToken(unlockToken);
  }

  async function handleDownload() {
    if (!token) return;

    setDownloadState("downloading");

    const res = await fetch(`/api/download?token=${encodeURIComponent(token)}`, {
      method: "GET",
    }).catch(() => null);

    if (!res || !res.ok) {
      setDownloadState("error");
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = outputFileName;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
    setDownloadState("done");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor={`${toolSlug}-file`}>{label}</Label>
        <Input
          id={`${toolSlug}-file`}
          type="file"
          accept={accept}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="space-y-2">
        <Button onClick={onRun} disabled={!canRun}>
          {runState === "processing" ? "Processing…" : "Run"}
        </Button>
        {message && <p className="text-xs text-muted-foreground">{message}</p>}
      </div>

      {preview && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Preview</div>
          <pre className="whitespace-pre-wrap rounded border bg-muted px-4 py-3 text-sm">
            {previewSample}
          </pre>
          <p className="text-xs text-muted-foreground">
            This is a sample of the processed result.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <ToolUnlock
          enabled={!!preview && !!resultId}
          toolSlug={toolSlug}
          resultId={resultId}
          onUnlock={handleUnlock}
        />

        {token && (
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={downloadState === "downloading"}
            >
              {downloadState === "downloading" ? "Downloading…" : "Download full file"}
            </Button>
            <p className="text-xs text-muted-foreground">
              {downloadState === "idle" && "Download is available."}
              {downloadState === "downloading" && "Downloading…"}
              {downloadState === "done" && "File downloaded."}
              {downloadState === "error" && "Download failed."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
