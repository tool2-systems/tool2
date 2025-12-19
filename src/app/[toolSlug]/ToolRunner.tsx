"use client"

import { useMemo, useRef, useState } from "react"

type Tool = {
  slug: string
  title: string
  oneLiner: string
  priceUsd: number
  input: { accepts: string[]; maxSizeMb: number }
}

type State =
  | { kind: "idle" }
  | { kind: "previewing" }
  | { kind: "preview_ready"; runId: string; totalRows: number; uniqueRows: number; duplicates: number }
  | { kind: "processing"; runId: string }
  | { kind: "ready"; runId: string }
  | { kind: "error"; message: string }

export function ToolRunner({ tool }: { tool: Tool }) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<State>({ kind: "idle" })

  const acceptAttr = useMemo(() => tool.input.accepts.join(","), [tool.input.accepts])
  const maxBytes = tool.input.maxSizeMb * 1024 * 1024

  function clearFileInput() {
    if (inputRef.current) inputRef.current.value = ""
  }

  function resetToNewFile() {
    setFile(null)
    setState({ kind: "idle" })
    clearFileInput()
  }

  function startDownload(runId: string) {
    window.location.href = `/download/${runId}`
  }

  async function onGeneratePreview() {
    if (!file) return
    if (file.size > maxBytes) {
      setState({ kind: "error", message: `File exceeds ${tool.input.maxSizeMb} MB limit.` })
      return
    }

    setState({ kind: "previewing" })

    const form = new FormData()
    form.append("file", file)

    const res = await fetch(`/api/preview/${tool.slug}`, { method: "POST", body: form })
    if (!res.ok) {
      setState({ kind: "error", message: "Preview failed." })
      return
    }

    const json = await res.json()
    setState({
      kind: "preview_ready",
      runId: json.runId,
      totalRows: json.preview.totalRows,
      uniqueRows: json.preview.uniqueRows,
      duplicates: json.preview.duplicates
    })
  }

  async function onPayAndDownload() {
    if (state.kind !== "preview_ready") return

    setState({ kind: "processing", runId: state.runId })

    const unlock = await fetch("/api/unlock", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runId: state.runId })
    })
    if (!unlock.ok) {
      setState({ kind: "error", message: "Payment failed." })
      return
    }

    const proc = await fetch(`/api/process/${tool.slug}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runId: state.runId })
    })
    if (!proc.ok) {
      setState({ kind: "error", message: "Processing failed." })
      return
    }

    const runId = state.runId
    setState({ kind: "ready", runId })
    startDownload(runId)
  }

  return (
    <main>
      <h1>{tool.title}</h1>
      <p>{tool.oneLiner}</p>

      {state.kind !== "ready" && (
        <section>
          <h2>Upload</h2>
          <input
            ref={inputRef}
            type="file"
            accept={acceptAttr}
            onClick={() => clearFileInput()}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null
              setFile(f)
              setState({ kind: "idle" })
            }}
          />

          {state.kind === "idle" && (
            <button onClick={onGeneratePreview} disabled={!file}>
              Generate preview
            </button>
          )}

          {state.kind === "previewing" && (
            <div style={{ marginTop: 10, color: "var(--muted)" }}>
              Analyzing file…
            </div>
          )}

          {state.kind === "error" && <div style={{ marginTop: 10 }}>{state.message}</div>}
        </section>
      )}

      {state.kind === "preview_ready" && (
        <section>
          <h2>Preview</h2>
          <div>{state.duplicates} duplicate rows will be removed.</div>
          <div>{state.uniqueRows} rows will remain out of {state.totalRows}.</div>

          <button onClick={onPayAndDownload} style={{ marginTop: 12 }}>
            Pay ${tool.priceUsd} and download CSV
          </button>

          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              onClick={resetToNewFile}
              style={{
                background: "transparent",
                color: "var(--muted)",
                border: "1px solid var(--border)"
              }}
            >
              Upload a new file
            </button>
          </div>
        </section>
      )}

      {state.kind === "processing" && (
        <section>
          <h2>Preparing</h2>
          <div>Preparing file…</div>
        </section>
      )}

      {state.kind === "ready" && (
        <section>
          <h2>Download</h2>
          <div>Download started.</div>

          <button onClick={() => startDownload(state.runId)} style={{ marginTop: 12 }}>
            Download CSV
          </button>

          <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
            File can be downloaded again without payment.
          </div>

          <button
            type="button"
            onClick={resetToNewFile}
            style={{
              marginTop: 12,
              background: "transparent",
              color: "var(--muted)",
              border: "1px solid var(--border)"
            }}
          >
            Upload a new file
          </button>
        </section>
      )}
    </main>
  )
}
