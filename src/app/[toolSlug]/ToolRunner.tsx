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

  function reset() {
    setFile(null)
    setState({ kind: "idle" })
    clearFileInput()
  }

  async function onGeneratePreview() {
    if (!file) return
    if (file.size > maxBytes) {
      setState({ kind: "error", message: `File too large. Max ${tool.input.maxSizeMb} MB.` })
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

    setState({ kind: "ready", runId: state.runId })
    window.location.href = `/download/${state.runId}`
  }

  return (
    <main>
      <h1>{tool.title}</h1>
      <p>{tool.oneLiner}</p>

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

        {state.kind === "previewing" && <div style={{ marginTop: 10, color: "var(--muted)" }}>Analyzing file…</div>}
        {state.kind === "error" && <div style={{ marginTop: 10 }}>{state.message}</div>}
      </section>

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
              onClick={reset}
              style={{
                background: "transparent",
                color: "var(--muted)",
                border: "1px solid var(--border)"
              }}
            >
              Change file
            </button>
          </div>
        </section>
      )}

      {state.kind === "processing" && (
        <section>
          <h2>Preparing</h2>
          <div>Preparing your file…</div>
        </section>
      )}

      {state.kind === "ready" && (
        <section>
          <h2>Download</h2>
          <div>Download should start automatically.</div>
          <div style={{ marginTop: 10 }}>
            <a href={`/download/${state.runId}`}>Download CSV</a>
          </div>
          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              onClick={reset}
              style={{
                background: "transparent",
                color: "var(--muted)",
                border: "1px solid var(--border)"
              }}
            >
              Run again
            </button>
          </div>
        </section>
      )}

      <footer>
        <small>Save this page if you need it again.</small>
      </footer>
    </main>
  )
}
